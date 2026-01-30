"""Nota model."""
from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base_mixin import TenantYearMixin


class Nota(Base, TenantYearMixin):
    __tablename__ = "notas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    aluno_id: Mapped[int] = mapped_column(ForeignKey("alunos.id", ondelete="CASCADE"), nullable=False)
    disciplina: Mapped[str] = mapped_column(String(80), nullable=False)
    disciplina_normalizada: Mapped[str] = mapped_column(String(80), nullable=False)
    trimestre1: Mapped[float | None] = mapped_column(Numeric(5, 2))
    trimestre2: Mapped[float | None] = mapped_column(Numeric(5, 2))
    trimestre3: Mapped[float | None] = mapped_column(Numeric(5, 2))
    total: Mapped[float | None] = mapped_column(Numeric(5, 2))
    faltas: Mapped[int] = mapped_column(Integer, default=0)
    situacao: Mapped[str | None] = mapped_column(String(20))

    aluno = relationship("Aluno", back_populates="notas")
