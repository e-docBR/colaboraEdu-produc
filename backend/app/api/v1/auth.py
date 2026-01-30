"""Auth endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from pydantic import ValidationError
from sqlalchemy import select

from ...core.database import session_scope
from ...core.security import generate_tokens
from ...services.usuario_service import UsuarioService
from ...schemas.usuario import LoginRequest, ChangePasswordRequest

def register(parent: Blueprint) -> None:
    bp = Blueprint("auth", __name__)

    @bp.get("/auth/tenants")
    def list_public_tenants():
        from ...models.tenant import Tenant
        with session_scope() as session:
            tenants = session.execute(
                select(Tenant).where(Tenant.is_active == True)
            ).scalars().all()
            return jsonify([{"id": t.id, "name": t.name, "slug": t.slug} for t in tenants])

    @bp.post("/auth/login")
    def login():
        try:
            payload = LoginRequest(**(request.get_json() or {}))
        except ValidationError as e:
            raise e

        with session_scope() as session:
            service = UsuarioService(session)
            response = service.authenticate(
                payload.username, 
                payload.password, 
                tenant_slug=payload.tenant_slug
            )
            return jsonify(response.model_dump())

    @bp.post("/auth/refresh")
    @jwt_required(refresh=True)
    def refresh():
        identity = get_jwt_identity()
        jwt_data = get_jwt()
        roles = jwt_data.get("roles", [])
        extra_claims = {"aluno_id": jwt_data.get("aluno_id")}
        tokens = generate_tokens(identity=identity, roles=roles, extra_claims=extra_claims)
        return jsonify(tokens)

    @bp.post("/auth/logout")
    @jwt_required()
    def logout():
        return ("", 204)

    @bp.post("/auth/change-password")
    @jwt_required()
    def change_password():
        try:
            payload = ChangePasswordRequest(**(request.get_json() or {}))
        except ValidationError as e:
             raise e

        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            service = UsuarioService(session)
            service.change_password(user_id, payload.current_password, payload.new_password)
            
        return ("", 204)

    parent.register_blueprint(bp)
