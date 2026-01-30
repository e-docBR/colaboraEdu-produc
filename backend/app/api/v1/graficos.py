"""Endpoints para gráficos dinâmicos do dashboard."""
from __future__ import annotations

from datetime import datetime
from typing import Callable

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import session_scope
from ...models import Aluno, Nota

DISCIPLINA_NORMALIZACAO = {
    "ARTES": "ARTE",
    "INGLES": "LÍNGUA INGLESA",
    "INGLÊS": "LÍNGUA INGLESA",
    "LÍNGUA PORTUGUÊSA": "LÍNGUA PORTUGUESA",
    "LINGUA PORTUGUESA": "LÍNGUA PORTUGUESA",
}


def _normalize_disciplina(nome: str | None) -> str:
    if not nome:
        return "OUTROS"
    chave = nome.strip().upper()
    return DISCIPLINA_NORMALIZACAO.get(chave, nome.strip())

GraphBuilder = Callable[
    [Session, str | None, str | None, str | None, str | None, str | None],
    list[dict[str, object]],
]


def register(parent: Blueprint) -> None:
    bp = Blueprint("graficos", __name__)

    @bp.get("/graficos/<string:slug>")
    @jwt_required()
    def get_grafico(slug: str):
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        builder = GRAPH_BUILDERS.get(slug)
        if not builder:
            return jsonify({"error": "Gráfico não encontrado"}), 404

        turno = request.args.get("turno") or None
        serie = request.args.get("serie") or None
        turma = request.args.get("turma") or None
        trimestre = request.args.get("trimestre") or None
        disciplina = request.args.get("disciplina") or None

        with session_scope() as session:
            data = builder(session, turno, serie, turma, trimestre, disciplina)

        return jsonify({"slug": slug, "dados": data})

    parent.register_blueprint(bp)


TRIMESTRE_COLUMNS = {
    "1": Nota.trimestre1,
    "2": Nota.trimestre2,
    "3": Nota.trimestre3,
}


def _resolve_trimestre_column(trimestre: str | None):
    if trimestre in TRIMESTRE_COLUMNS:
        return TRIMESTRE_COLUMNS[trimestre]
    return Nota.total


def _apply_common_filters(query, turno: str | None, serie: str | None, turma: str | None, disciplina: str | None):
    from flask import g
    tenant_id = getattr(g, "tenant_id", None)
    year_id = getattr(g, "academic_year_id", None)
    
    if tenant_id:
        query = query.filter(Aluno.tenant_id == tenant_id)
    if year_id:
        query = query.filter(Aluno.academic_year_id == year_id)
        
    if turno:
        query = query.filter(Aluno.turno == turno)
    if serie:
        query = query.filter(Aluno.turma.ilike(f"{serie}%"))
    if turma:
        query = query.filter(Aluno.turma == turma)
    if disciplina:
        query = query.filter(Nota.disciplina.ilike(f"%{disciplina}%"))
    return query


def _disciplinas_medias(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    trimestre: str | None,
    disciplina: str | None,
):
    column = _resolve_trimestre_column(trimestre)
    query = session.query(
        Nota.disciplina,
        func.sum(column).label("soma"),
        func.count(column).label("quantidade"),
    )
    query = query.join(Aluno)
    query = _apply_common_filters(query, turno, serie, turma, disciplina)
    query = query.group_by(Nota.disciplina)

    agregados: dict[str, dict[str, float]] = {}
    for disciplina, soma, quantidade in query.all():
        disciplina_normalizada = _normalize_disciplina(disciplina)
        bucket = agregados.setdefault(disciplina_normalizada, {"soma": 0.0, "quantidade": 0})
        bucket["soma"] += float(soma or 0.0)
        bucket["quantidade"] += int(quantidade or 0)

    resultados = []
    for disciplina_normalizada, valores in agregados.items():
        media_final = valores["soma"] / valores["quantidade"] if valores["quantidade"] else 0.0
        resultados.append({"disciplina": disciplina_normalizada, "media": round(media_final, 2)})

    resultados.sort(key=lambda item: item["media"], reverse=True)
    return resultados


def _turmas_trimestre(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    _trimestre: str | None,
    disciplina: str | None,
):
    results: list[dict[str, object]] = []
    for trimestre, column in TRIMESTRE_COLUMNS.items():
        query = session.query(func.avg(column))
        query = query.join(Aluno)
        query = _apply_common_filters(query, turno, serie, turma, disciplina)
        media = query.scalar()
        results.append({"trimestre": f"{trimestre}º", "media": round(float(media), 2) if media else 0.0})
    return results


def _situacao_distribuicao(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    _trimestre: str | None,
    _disciplina: str | None,
):
    # Conta alunos únicos por situação (não registros de notas)
    # Agrupa situações de cada aluno e considera a PIOR situação
    
    # Busca todas as notas com filtros aplicados
    query = session.query(Nota.aluno_id, Nota.situacao)
    query = query.join(Aluno, Nota.aluno_id == Aluno.id)
    query = _apply_common_filters(query, turno, serie, turma, None)
    
    # Agrupa por aluno e determina situação
    # Lógica: Se tiver QUALQUER reprovação/recuperação -> Recuperação
    # Se não tiver reprovação mas tiver aprovação -> Aprovado
    # Senão -> Outros
    
    aluno_situacoes: dict[int, str] = {}
    
    # Mapeamento de status
    STATUS_REPROVADO = {"REP", "REC", "REPROVADO"}
    STATUS_APROVADO = {"APR", "APROVADO", "AR", "ACC"}
    
    # Verifica data limite para recuperação (21/12)
    now = datetime.now()
    cutoff_date = datetime(now.year, 12, 21)
    is_past_cutoff = now > cutoff_date

    # Primeiro passo: coletar todos os status de cada aluno
    aluno_status_set: dict[int, set[str]] = {}
    
    for aluno_id, situacao in query.all():
        if aluno_id not in aluno_status_set:
            aluno_status_set[aluno_id] = set()
        
        if situacao:
            aluno_status_set[aluno_id].add(situacao.upper())
            
    # Segundo passo: determinar status final
    for aluno_id, status_set in aluno_status_set.items():
        # Se tem alguma reprovação
        if not status_set.isdisjoint(STATUS_REPROVADO):
            aluno_situacoes[aluno_id] = "Reprovado"
        # Se não tem reprovação, mas tem aprovação
        elif not status_set.isdisjoint(STATUS_APROVADO):
            aluno_situacoes[aluno_id] = "Aprovado"
        else:
            aluno_situacoes[aluno_id] = "Outros"
    
    # Conta por categoria
    data: dict[str, int] = {}
    for situacao in aluno_situacoes.values():
        data[situacao] = data.get(situacao, 0) + 1
    
    return [
        {"situacao": label, "total": quantidade}
        for label, quantidade in sorted(data.items())
    ]


def _faltas_por_turma(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    _trimestre: str | None,
    _disciplina: str | None,
):
    query = (
        session.query(Aluno.turma, func.sum(Nota.faltas).label("faltas"))
        .join(Nota)
        .group_by(Aluno.turma)
        .order_by(func.sum(Nota.faltas).desc())
    )
    query = _apply_common_filters(query, turno, serie, turma, None)
    results = query.limit(10).all()
    return [
        {"turma": turma_nome, "faltas": int(faltas or 0)}
        for turma_nome, faltas in results
    ]


def _heatmap_disciplinas(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    trimestre: str | None,
    disciplina: str | None,
):
    column = _resolve_trimestre_column(trimestre)
    query = session.query(Aluno.turma, Nota.disciplina, func.avg(column).label("media"))
    query = query.join(Aluno)
    query = _apply_common_filters(query, turno, serie, turma, disciplina)
    query = query.group_by(Aluno.turma, Nota.disciplina)

    agregados: dict[tuple[str, str], dict[str, float]] = {}
    for turma_nome, disciplina, media in query.all():
        disciplina_normalizada = _normalize_disciplina(disciplina)
        chave = (turma_nome, disciplina_normalizada)
        bucket = agregados.setdefault(chave, {"soma": 0.0, "quantidade": 0})
        bucket["soma"] += float(media or 0.0)
        bucket["quantidade"] += 1

    resultados = []
    for (turma_nome, disciplina_normalizada), valores in agregados.items():
        media_final = valores["soma"] / valores["quantidade"] if valores["quantidade"] else 0.0
        resultados.append(
            {
                "turma": turma_nome,
                "disciplina": disciplina_normalizada,
                "media": round(media_final, 2),
            }
        )

    resultados.sort(key=lambda item: (item["turma"], item["disciplina"]))
    return resultados


def _medias_por_trimestre(
    session,
    turno: str | None,
    serie: str | None,
    turma: str | None,
    _trimestre: str | None,
    disciplina: str | None,
):
    resultados: list[dict[str, object]] = []
    for trimestre_label, column in TRIMESTRE_COLUMNS.items():
        query = session.query(func.avg(column))
        query = query.join(Aluno)
        query = _apply_common_filters(query, turno, serie, turma, disciplina)
        media = query.scalar()
        resultados.append(
            {
                "trimestre": f"{trimestre_label}º",
                "media": round(float(media), 2) if media else 0.0,
            }
        )
    return resultados


GRAPH_BUILDERS: dict[str, GraphBuilder] = {
    "disciplinas-medias": _disciplinas_medias,
    "turmas-trimestre": _turmas_trimestre,
    "situacao-distribuicao": _situacao_distribuicao,
    "faltas-por-turma": _faltas_por_turma,
    "heatmap-disciplinas": _heatmap_disciplinas,
    "medias-por-trimestre": _medias_por_trimestre,
}
