"""Alunos endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ...core.database import session_scope
from ...services.aluno_service import AlunoService


def register(parent: Blueprint) -> None:
    bp = Blueprint("alunos", __name__)

    @bp.get("/alunos")
    @jwt_required()
    def list_alunos():
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
            
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(10000, int(request.args.get("per_page", 20)))
        turno = request.args.get("turno")
        turma = request.args.get("turma")
        query_text = request.args.get("q")

        user_id = int(get_jwt_identity())
        with session_scope() as session:
            service = AlunoService(session, user_id=user_id)
            result = service.list_alunos(
                page=page,
                per_page=per_page,
                turno=turno,
                turma=turma,
                query_text=query_text
            )
            
            # Pydantic v2 use model_dump
            return jsonify(result.model_dump())

    @bp.get("/alunos/<int:aluno_id>")
    @jwt_required()
    def retrieve_aluno(aluno_id: int):
        claims = get_jwt()
        aluno_claim_id = claims.get("aluno_id")
        
        if "aluno" in (claims.get("roles") or []):
            if not aluno_claim_id or int(aluno_claim_id) != int(aluno_id):
                return jsonify({"error": "Acesso restrito"}), 403
                
        user_id = int(get_jwt_identity())
        with session_scope() as session:
            service = AlunoService(session, user_id=user_id)
            aluno_detail = service.get_aluno_details(aluno_id)
            
            if not aluno_detail:
                return jsonify({"error": "Aluno não encontrado"}), 404

            return jsonify(aluno_detail.model_dump())

    @bp.post("/alunos")
    @jwt_required()
    def create_aluno():
        roles = get_jwt().get("roles") or []
        if not any(r in roles for r in ["admin", "super_admin", "coordenador", "diretor", "orientador"]):
            return jsonify({"error": "Acesso negado. Apenas administradores podem criar alunos."}), 403
            
        data = request.get_json()
        user_id = int(get_jwt_identity())
        with session_scope() as session:
            service = AlunoService(session, user_id=user_id)
            aluno = service.create_aluno(data)
            return jsonify(aluno.model_dump()), 201

    @bp.patch("/alunos/<int:aluno_id>")
    @jwt_required()
    def update_aluno(aluno_id: int):
        roles = get_jwt().get("roles") or []
        if not any(r in roles for r in ["admin", "super_admin", "coordenador", "diretor", "orientador"]):
            return jsonify({"error": "Acesso negado. Apenas administradores podem editar alunos."}), 403
            
        data = request.get_json()
        user_id = int(get_jwt_identity())
        with session_scope() as session:
            service = AlunoService(session, user_id=user_id)
            aluno = service.update_aluno(aluno_id, data)
            if not aluno:
                return jsonify({"error": "Aluno não encontrado"}), 404
            return jsonify(aluno.model_dump())

    @bp.delete("/alunos/<int:aluno_id>")
    @jwt_required()
    def delete_aluno(aluno_id: int):
        roles = get_jwt().get("roles") or []
        if not any(r in roles for r in ["admin", "super_admin", "coordenador", "diretor", "orientador"]):
            return jsonify({"error": "Acesso negado. Apenas administradores podem excluir alunos."}), 403
            
        user_id = int(get_jwt_identity())
        with session_scope() as session:
            service = AlunoService(session, user_id=user_id)
            if service.delete_aluno(aluno_id):
                return "", 204
            return jsonify({"error": "Aluno não encontrado"}), 404

    @bp.get("/alunos/<int:aluno_id>/boletim/pdf")
    @jwt_required()
    def download_bulletin_pdf(aluno_id: int):
        from flask import send_file, g
        from ...services.document_service import DocumentService
        
        with session_scope() as session:
            service = AlunoService(session)
            aluno_data = service.get_bulletin_data(aluno_id)
            
            if not aluno_data:
                return jsonify({"error": "Aluno não encontrado"}), 404
            
            school_name = g.get("tenant").name if g.get("tenant") else "ColaboraFREI"
            year_label = "2026" # Fallback
            if g.get("academic_year_id"):
                 from ...models.academic_year import AcademicYear
                 year = session.get(AcademicYear, g.academic_year_id)
                 if year:
                     year_label = year.label

            html = DocumentService.render_bulletin_html(aluno_data, school_name, year_label)
            pdf_bytes = DocumentService.generate_pdf_from_html(html)
            
            filename = f"Boletim_{aluno_data['nome'].replace(' ', '_')}.pdf"
            return send_file(
                pdf_bytes,
                mimetype="application/pdf",
                as_attachment=True,
                download_name=filename
            )

    parent.register_blueprint(bp)
