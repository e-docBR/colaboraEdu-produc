"""Dashboard analytics endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func

from ...core.database import session_scope
from ...core.cache import cache_response
from ...services import build_dashboard_metrics, build_teacher_dashboard


def register(parent: Blueprint) -> None:
    bp = Blueprint("dashboard", __name__)

    @bp.get("/dashboard/kpis")
    @jwt_required()
    @cache_response(timeout=600, key_prefix="dashboard_kpis")
    def fetch_kpis():
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        with session_scope() as session:
            metrics = build_dashboard_metrics(session)
        return metrics.to_dict()

    @bp.get("/dashboard/professor")
    @jwt_required()
    @cache_response(timeout=300, key_prefix="dashboard_professor")
    def fetch_teacher_dashboard():
        query = request.args.get("q")
        turno = request.args.get("turno")
        turma = request.args.get("turma")
        with session_scope() as session:
            data = build_teacher_dashboard(session, query, turno, turma)
        return data

    parent.register_blueprint(bp)
