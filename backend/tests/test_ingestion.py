from sqlalchemy import select

from app.core.database import session_scope
from app.models import Aluno, Nota, Usuario
from app.services.ingestion import (
    ParsedAlunoRecord,
    ParsedNotaRecord,
    _extract_student_meta,
    apply_records,
)


def _cleanup_matricula(matricula: str) -> None:
    with session_scope() as session:
        usuario = session.execute(select(Usuario).where(Usuario.username == "fulanotest-ingest")).scalar_one_or_none()
        if usuario:
            session.delete(usuario)
        aluno = session.execute(select(Aluno).where(Aluno.matricula == matricula)).scalar_one_or_none()
        if aluno:
            usuario = session.execute(select(Usuario).where(Usuario.aluno_id == aluno.id)).scalar_one_or_none()
            if usuario:
                session.delete(usuario)
            session.delete(aluno)
        session.commit()


def test_apply_records_creates_and_updates_aluno_notas():
    matricula = "TEST-INGEST"
    _cleanup_matricula(matricula)

    primeira_execucao = ParsedAlunoRecord(
        matricula=matricula,
        nome="Fulano da Silva",
        turma="6A",
        turno="MATUTINO",
        notas=[
            ParsedNotaRecord(
                disciplina="Matemática",
                disciplina_normalizada="matematica",
                trimestre1=8.5,
                trimestre2=9.0,
                trimestre3=8.0,
                total=25.5,
                faltas=2,
                situacao="APROVADO",
            )
        ],
    )

    assert apply_records([primeira_execucao]) == 1

    with session_scope() as session:
        aluno = session.execute(select(Aluno).where(Aluno.matricula == matricula)).scalar_one()
        assert aluno.nome == "Fulano da Silva"
        assert aluno.turma == "6A"
        assert aluno.turno == "MATUTINO"
        nota = session.execute(
            select(Nota).where(Nota.aluno_id == aluno.id, Nota.disciplina_normalizada == "matematica")
        ).scalar_one()
        assert float(nota.trimestre1) == 8.5
        assert nota.faltas == 2

    segunda_execucao = ParsedAlunoRecord(
        matricula=matricula,
        nome="Fulano Atualizado",
        turma="6B",
        turno="VESPERTINO",
        notas=[
            ParsedNotaRecord(
                disciplina="Matemática",
                disciplina_normalizada="matematica",
                trimestre1=9.5,
                trimestre2=9.0,
                trimestre3=9.2,
                total=27.7,
                faltas=1,
                situacao="APROVADO",
            )
        ],
    )

    assert apply_records([segunda_execucao]) == 1

    with session_scope() as session:
        aluno = session.execute(select(Aluno).where(Aluno.matricula == matricula)).scalar_one()
        assert aluno.nome == "Fulano Atualizado"
        assert aluno.turma == "6B"
        assert aluno.turno == "VESPERTINO"
        nota = session.execute(
            select(Nota).where(Nota.aluno_id == aluno.id, Nota.disciplina_normalizada == "matematica")
        ).scalar_one()
        assert float(nota.trimestre1) == 9.5
        assert nota.faltas == 1

    _cleanup_matricula(matricula)


def test_extract_student_meta_from_pdf_text():
    text = (
        "BOLETIM ESCOLAR - 2025\n"
        "Aluno(a): ANA KELLY GOMES GONSALVES Matrícula: 47270\n"
        "Turma: 6º ANO A MATUTINO - - Ensino Fundamental de 9 anos - 6º Ano"
    )

    metas = _extract_student_meta(text)
    assert len(metas) == 1
    meta = metas[0]

    assert meta["nome"] == "ANA KELLY GOMES GONSALVES"
    assert meta["matricula"] == "47270"
    assert meta["turma"] == "6º ANO A"
    assert meta["turno"] == "Matutino"


def test_extract_student_meta_handles_multiple_students_on_page():
    text = (
        "Aluno(a): ALUNO UM Matrícula: 10001\n"
        "Turma: 6º ANO A MATUTINO - - Ensino Fundamental\n"
        "Aluno(a): ALUNO DOIS Matrícula: 10002\n"
        "Turma: 6º ANO A MATUTINO - - Ensino Fundamental\n"
    )

    metas = _extract_student_meta(text)

    assert len(metas) == 2
    assert metas[0]["matricula"] == "10001"
    assert metas[1]["matricula"] == "10002"
    assert metas[0]["turma"] == "6º ANO A"
