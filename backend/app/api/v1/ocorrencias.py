from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from pydantic import ValidationError

from ...core.database import session_scope
from ...services.ocorrencia_service import OcorrenciaService
from ...schemas.ocorrencia import OcorrenciaCreate, OcorrenciaUpdate

def register(parent: Blueprint) -> None:
    bp = Blueprint("ocorrencias", __name__)

    @bp.get("/ocorrencias")
    @jwt_required()
    def list_ocorrencias():
        req_aluno_id = request.args.get("aluno_id")
        claims = get_jwt()
        roles = claims.get("roles", [])
        user_aluno_id = claims.get("aluno_id")
        user_id = int(get_jwt_identity()) # needed for service init? Not really for list but consistent

        with session_scope() as session:
            service = OcorrenciaService(session, user_id)
            
            # Authorization logic for listing
            is_staff = any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles)
            
            target_aluno_id = None
            if not is_staff:
                if not user_aluno_id:
                     return jsonify([]), 200
                target_aluno_id = int(user_aluno_id)
            else:
                if req_aluno_id:
                    target_aluno_id = int(req_aluno_id)

            results = service.list_ocorrencias(aluno_id=target_aluno_id)
            return jsonify([r.model_dump() for r in results])

    @bp.post("/ocorrencias")
    @jwt_required()
    def create_ocorrencia():
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        user_id = int(get_jwt_identity())
        
        try:
             schema = OcorrenciaCreate(**data)
        except ValidationError as e:
             return jsonify(e.errors()), 400

        with session_scope() as session:
            service = OcorrenciaService(session, user_id)
            try:
                service.create(schema) # we can return created object if needed
                return jsonify({"message": "Ocorrência registrada!"}), 201
            except Exception as e:
                # In production use logger
                return jsonify({"error": str(e)}), 500

    @bp.patch("/ocorrencias/<int:ocorrencia_id>")
    @jwt_required()
    def update_ocorrencia(ocorrencia_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        user_id = int(get_jwt_identity())
        
        try:
            schema = OcorrenciaUpdate(**data)
        except ValidationError as e:
             return jsonify(e.errors()), 400

        with session_scope() as session:
            service = OcorrenciaService(session, user_id)
            updated = service.update(ocorrencia_id, schema)
            
            if not updated:
                return jsonify({"error": "Ocorrência não encontrada"}), 404
            
            return jsonify({"message": "Atualizado com sucesso"}), 200

    @bp.delete("/ocorrencias/<int:ocorrencia_id>")
    @jwt_required()
    def delete_ocorrencia(ocorrencia_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "coordenador", "direcao", "diretor", "orientacao", "orientador"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        user_id = int(get_jwt_identity())

        with session_scope() as session:
            service = OcorrenciaService(session, user_id)
            success = service.delete(ocorrencia_id)
            
            if not success:
                return jsonify({"error": "Ocorrência não encontrada"}), 404
        
        return jsonify({"message": "Removido com sucesso"}), 200

    parent.register_blueprint(bp)
