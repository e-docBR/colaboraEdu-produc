"""Turmas endpoints."""
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from urllib.parse import unquote

from ...core.database import session_scope
from ...services.turma_service import TurmaService


def register(parent: Blueprint) -> None:
    bp = Blueprint("turmas", __name__)

    @bp.get("/turmas")
    @jwt_required()
    def list_turmas():
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
            
        with session_scope() as session:
            service = TurmaService(session)
            result = service.list_turmas()
            return jsonify(result.model_dump())

    @bp.get("/turmas/<path:turma_nome>/alunos")
    @jwt_required()
    def list_alunos_por_turma(turma_nome: str):
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
            
        turma_decoded = unquote(turma_nome)
        
        with session_scope() as session:
            service = TurmaService(session)
            result = service.get_turma_detail(turma_decoded)
            
            if not result:
                # Return empty structure as per original contract if not found/empty
                return jsonify({"turma": turma_decoded, "alunos": [], "total": 0}), 200

            return jsonify(result.model_dump())

    parent.register_blueprint(bp)
