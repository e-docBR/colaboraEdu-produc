"""Uploads endpoints for boletim PDFs."""
from pathlib import Path
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from ...core.config import settings
from ...services import enqueue_pdf


def register(parent: Blueprint) -> None:
    bp = Blueprint("uploads", __name__)

    @bp.post("/uploads/pdf")
    @jwt_required()
    def upload_boletim():
        if "file" not in request.files:
            return jsonify({"error": "arquivo não enviado"}), 400

        turno = (request.form.get("turno") or "").strip()
        turma = (request.form.get("turma") or "").strip()
        if not turno or not turma:
            return jsonify({"error": "turno e turma são obrigatórios"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"error": "nome de arquivo inválido"}), 400

        upload_dir = Path(settings.upload_folder) / _normalize_segment(turno) / _normalize_segment(turma)
        upload_dir.mkdir(parents=True, exist_ok=True)
        filepath = upload_dir / filename
        file.save(filepath)

        from flask import g
        job_id = enqueue_pdf(
            filepath, 
            turno=turno, 
            turma=turma, 
            tenant_id=g.tenant_id, 
            academic_year_id=g.academic_year_id
        )
        return (
            jsonify(
                {
                    "filename": filename,
                    "status": "queued",
                    "job_id": job_id,
                    "turno": turno,
                    "turma": turma,
                }
            ),
            202,
        )

    @bp.get("/uploads/jobs/<job_id>")
    @jwt_required()
    def get_job_status(job_id):
        try:
            from rq.job import Job
            from ...core.queue import redis_conn
            
            job = Job.fetch(job_id, connection=redis_conn)
            return jsonify({
                "job_id": job.id,
                "status": job.get_status(),
                "result": job.result if job.is_finished else None,
                "enqueued_at": job.enqueued_at.isoformat() if job.enqueued_at else None,
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "ended_at": job.ended_at.isoformat() if job.ended_at else None,
                "meta": job.meta
            })
        except Exception:
            return jsonify({"error": "Job not found"}), 404

    parent.register_blueprint(bp)


def _normalize_segment(value: str) -> str:
    slug = re.sub(r"[^0-9A-Za-z_-]+", "-", value.strip())
    return slug or "geral"
