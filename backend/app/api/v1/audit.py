from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import select, desc

from ...core.database import session_scope
from ...models import AuditLog

def register(parent: Blueprint) -> None:
    bp = Blueprint("audit", __name__)

    @bp.get("/audit-logs")
    @jwt_required()
    def list_logs():
        claims = get_jwt()
        roles = claims.get("roles", [])
        if "admin" not in roles:
            return jsonify({"error": "Acesso negado"}), 403

        with session_scope() as session:
            # Query last 100 logs
            stm = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(100)
            results = session.execute(stm).scalars().all()
            return jsonify([log.to_dict() for log in results])

    parent.register_blueprint(bp)
