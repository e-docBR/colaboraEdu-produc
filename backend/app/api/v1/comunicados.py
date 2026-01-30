from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select, desc, or_

from ...core.database import session_scope
from ...models import Comunicado, Aluno, Usuario, ComunicadoLeitura

def register(parent: Blueprint) -> None:
    bp = Blueprint("comunicados", __name__)

    @bp.get("/comunicados")
    @jwt_required()
    def list_comunicados():
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        roles = claims.get("roles", [])
        
        with session_scope() as session:
            has_permission = any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles)
            
            if has_permission:
                # Staff see everything
                results = session.query(Comunicado).order_by(desc(Comunicado.data_envio)).all()
            else:
                aluno_id = claims.get("aluno_id")
                turma_slug = None
                if aluno_id:
                    aluno = session.get(Aluno, aluno_id)
                    if aluno:
                        turma_slug = aluno.turma

                # Build filters for students
                # 1. Always see TODOS
                # 2. See their TURMA
                # 3. See their PERSONAL (ALUNO)
                filters = [Comunicado.target_type == "TODOS"]
                if turma_slug:
                    filters.append((Comunicado.target_type == "TURMA") & (Comunicado.target_value == turma_slug))
                if aluno_id:
                    filters.append((Comunicado.target_type == "ALUNO") & (Comunicado.target_value == str(aluno_id)))
                
                results = session.query(Comunicado).filter(or_(*filters)).order_by(desc(Comunicado.data_envio)).all()

            # Get read IDs for this user
            read_ids = {r.comunicado_id for r in session.query(ComunicadoLeitura).filter_by(usuario_id=user_id).all()}

            output = []
            for comm in results:
                d = comm.to_dict()
                d["is_read"] = comm.id in read_ids
                output.append(d)

            return jsonify(output)

    @bp.post("/comunicados")
    @jwt_required()
    def create_comunicado():
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        if not data.get("titulo") or not data.get("conteudo"):
            return jsonify({"error": "Campos obrigatórios: titulo, conteudo"}), 400

        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            novo = Comunicado(
                titulo=data["titulo"],
                conteudo=data["conteudo"],
                autor_id=user_id,
                target_type=data.get("target_type", "TODOS"),
                target_value=data.get("target_value")
            )
            session.add(novo)
        
        return jsonify({"message": "Comunicado enviado!"}), 201

    @bp.patch("/comunicados/<int:comunicado_id>")
    @jwt_required()
    def update_comunicado(comunicado_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        user_id = int(get_jwt_identity())

        with session_scope() as session:
            comunicado = session.get(Comunicado, comunicado_id)
            if not comunicado:
                return jsonify({"error": "Comunicado não encontrado"}), 404
            
            # Check ownership if not admin? 
            # Let's simple check: Admin/Coord/Direcao can edit all. Professor only own?
            # For simplicity, let staff edit.
            
            if "titulo" in data:
                comunicado.titulo = data["titulo"]
            if "conteudo" in data:
                comunicado.conteudo = data["conteudo"]
            if "arquivado" in data:
                comunicado.arquivado = bool(data["arquivado"])
            
            # Audit could be added here similar to Ocorrencias

            session.add(comunicado)
        
        return jsonify({"message": "Atualizado com sucesso"}), 200

    @bp.delete("/comunicados/<int:comunicado_id>")
    @jwt_required()
    def delete_comunicado(comunicado_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            comunicado = session.get(Comunicado, comunicado_id)
            if not comunicado:
                return jsonify({"error": "Comunicado não encontrado"}), 404
            
            # Permission check: Admin/Coord or Author
            has_permission = any(r in ["admin", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles) or comunicado.autor_id == user_id
            if not has_permission:
                return jsonify({"error": "Acesso negado"}), 403

            session.delete(comunicado)
        
        return jsonify({"message": "Removido com sucesso"}), 200

    @bp.post("/comunicados/<int:comunicado_id>/read")
    @jwt_required()
    def mark_read(comunicado_id: int):
        user_id = int(get_jwt_identity())
        with session_scope() as session:
            leitura = ComunicadoLeitura(comunicado_id=comunicado_id, usuario_id=user_id)
            session.merge(leitura)
        return jsonify({"message": "Lido"}), 200

    parent.register_blueprint(bp)
