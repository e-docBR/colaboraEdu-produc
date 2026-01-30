from typing import Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base_mixin import TenantYearMixin

class Aluno(Base, TenantYearMixin):
    __tablename__ = "alunos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    matricula: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    turma: Mapped[str] = mapped_column(String(32), nullable=False)
    turno: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    notas = relationship("Nota", back_populates="aluno", cascade="all, delete-orphan")
    usuario = relationship("Usuario", back_populates="aluno", uselist=False)

