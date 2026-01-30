"""Endpoints para gerenciamento administrativo de usuários."""
from __future__ import annotations

from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload
from pathlib import Path
from werkzeug.utils import secure_filename

from ...core.config import settings
from ...core.database import session_scope
from ...core.security import hash_password
from ...models import Aluno, Usuario
from ...services.accounts import ensure_all_aluno_users


def serialize_usuario(usuario: Usuario) -> dict[str, object]:
    aluno_data = None
    if usuario.aluno:
        aluno_data = {
            "id": usuario.aluno.id,
            "nome": usuario.aluno.nome,
            "matricula": usuario.aluno.matricula,
            "turma": usuario.aluno.turma,
            "turno": usuario.aluno.turno,
        }
    return {
        "id": usuario.id,
        "username": usuario.username,
        "role": usuario.role,
        "is_admin": usuario.is_admin,
        "aluno_id": usuario.aluno_id,
        "photo_url": usuario.photo_url,
        "must_change_password": usuario.must_change_password,
        "tenant_id": usuario.tenant_id,
        "tenant_name": usuario.tenant_name,
        "aluno": aluno_data,
    }


def _is_admin() -> bool:
    roles = get_jwt().get("roles") or []
    return "admin" in roles or "super_admin" in roles


def register(parent: Blueprint) -> None:
    bp = Blueprint("usuarios", __name__)

    @bp.get("/usuarios")
    @jwt_required()
    def list_usuarios():
        if not _is_admin():
            return jsonify({"error": "Acesso restrito"}), 403

        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, int(request.args.get("per_page", 20)))
        query_text = request.args.get("q")
        role_filter = request.args.get("role")

        with session_scope() as session:
            ensure_all_aluno_users(session)
            session.flush()  # Ensure new users have IDs before querying
            
            query = (
                session.query(Usuario)
                .options(joinedload(Usuario.aluno))
                .outerjoin(Aluno)
            )
            if query_text:
                like = f"%{query_text}%"
                query = query.filter(
                    or_(
                        Usuario.username.ilike(like),
                        Aluno.nome.ilike(like),
                        Aluno.matricula.ilike(like),
                    )
                )
            if role_filter:
                query = query.filter(Usuario.role == role_filter)

            total = query.count()
            usuarios = (
                query.order_by(func.lower(Usuario.username))
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )
            
            # Serialize within session context to avoid DetachedInstanceError
            serialized_usuarios = [serialize_usuario(usuario) for usuario in usuarios]

        return jsonify(
            {
                "items": serialized_usuarios,
                "meta": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                },
            }
        )

    @bp.post("/usuarios")
    @jwt_required()
    def create_usuario():
        if not _is_admin():
            return jsonify({"error": "Acesso restrito"}), 403

        payload = request.get_json() or {}
        username = (payload.get("username") or "").strip()
        password = payload.get("password")
        role = payload.get("role") or "professor"
        aluno_id = payload.get("aluno_id")

        if not username or not password:
            return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

        from flask import g
        with session_scope() as session:
            existing = session.query(Usuario).filter(Usuario.username == username).first()
            if existing:
                return jsonify({"error": "Usuário já existe"}), 409

            if aluno_id is not None:
                aluno = session.get(Aluno, aluno_id)
                if not aluno:
                    return jsonify({"error": "Aluno informado não existe"}), 400

            usuario = Usuario(
                username=username,
                password_hash=hash_password(password),
                role=role,
                is_admin=bool(payload.get("is_admin")),
                aluno_id=aluno_id,
                must_change_password=payload.get("must_change_password", True),
                tenant_id=getattr(g, 'tenant_id', None)
            )
            session.add(usuario)
            session.flush()
            return jsonify(serialize_usuario(usuario)), 201

    @bp.patch("/usuarios/<int:usuario_id>")
    @jwt_required()
    def update_usuario(usuario_id: int):
        if not _is_admin():
            return jsonify({"error": "Acesso restrito"}), 403

        payload = request.get_json() or {}
        if not payload:
            return jsonify({"error": "Nenhum dado informado"}), 400

        with session_scope() as session:
            usuario = session.get(Usuario, usuario_id)
            if not usuario:
                return jsonify({"error": "Usuário não encontrado"}), 404

            new_username = payload.get("username")
            if new_username is not None:
                new_username = new_username.strip()
                if not new_username:
                    return jsonify({"error": "Usuário inválido"}), 400
                existing = (
                    session.query(Usuario)
                    .filter(Usuario.username == new_username, Usuario.id != usuario.id)
                    .first()
                )
                if existing:
                    return jsonify({"error": "Usuário já existe"}), 409
                usuario.username = new_username

            if "role" in payload:
                usuario.role = payload.get("role") or usuario.role

            if "is_admin" in payload:
                usuario.is_admin = bool(payload.get("is_admin"))

            if "must_change_password" in payload:
                usuario.must_change_password = bool(payload.get("must_change_password"))

            if "aluno_id" in payload:
                aluno_id_value = payload.get("aluno_id")
                if aluno_id_value is None:
                    usuario.aluno_id = None
                else:
                    aluno = session.get(Aluno, aluno_id_value)
                    if not aluno:
                        return jsonify({"error": "Aluno informado não existe"}), 400
                    usuario.aluno_id = aluno.id

            if payload.get("password"):
                usuario.password_hash = hash_password(payload["password"])
                usuario.must_change_password = payload.get("must_change_password", True)

            session.add(usuario)
            session.flush()
            session.refresh(usuario)
            payload = serialize_usuario(usuario)

        return jsonify(payload)

    @bp.delete("/usuarios/<int:usuario_id>")
    @jwt_required()
    def delete_usuario(usuario_id: int):
        if not _is_admin():
            return jsonify({"error": "Acesso restrito"}), 403

        current_user_id = int(get_jwt_identity())
        if current_user_id == usuario_id:
            return jsonify({"error": "Não é possível remover o próprio usuário"}), 400

        with session_scope() as session:
            usuario = session.get(Usuario, usuario_id)
            if not usuario:
                return jsonify({"error": "Usuário não encontrado"}), 404
            session.delete(usuario)

        return ("", 204)

    @bp.post("/usuarios/me/photo")
    @jwt_required()
    def upload_photo():
        if "file" not in request.files:
            return jsonify({"error": "Arquivo não enviado"}), 400
            
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "Nome de arquivo inválido"}), 400
            
        user_id = get_jwt_identity()
        import time
        ts = int(time.time())
        filename = secure_filename(f"user_{user_id}_{ts}_{file.filename}")
        
        # Ensure directory exists
        photos_dir = Path(settings.upload_folder) / "photos"
        photos_dir.mkdir(parents=True, exist_ok=True)
        
        filepath = photos_dir / filename
        file.save(filepath)
        
        # Update user in DB
        photo_url = f"/api/v1/static/photos/{filename}"
        with session_scope() as session:
            user = session.get(Usuario, int(user_id))
            if user:
                user.photo_url = photo_url
                session.add(user)
                
        return jsonify({"photo_url": photo_url})

    @bp.route("/static/photos/<path:filename>")
    def serve_photo(filename):
        import os
        from flask import current_app
        photos_dir = os.path.abspath(os.path.join(current_app.config["UPLOAD_FOLDER"], "photos"))
        current_app.logger.info(f"Serving photo: {filename} from {photos_dir}")
        return send_from_directory(photos_dir, filename)

    @bp.get("/usuarios/me")
    @jwt_required()
    def get_me():
        from flask import g
        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            usuario = (
                session.query(Usuario)
                .options(joinedload(Usuario.aluno), joinedload(Usuario.tenant))
                .filter(Usuario.id == user_id)
                .execution_options(include_all_tenants=True)
                .first()
            )
            if not usuario:
                return jsonify({"error": "Usuário não encontrado"}), 404
            
            # If user is an aluno, resolve their Aluno record for the active academic year
            # The ORM listener automatically filters Aluno queries by academic_year_id from g.academic_year_id
            if usuario.role == "aluno":
                # Search by matricula (which is persistent) in the current year
                active_aluno = session.query(Aluno).filter(
                    Aluno.matricula == usuario.username
                ).first()
                if active_aluno:
                    usuario.aluno = active_aluno
                    usuario.aluno_id = active_aluno.id
            
            return jsonify(serialize_usuario(usuario))

    parent.register_blueprint(bp)
