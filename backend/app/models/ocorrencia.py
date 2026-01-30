from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base_mixin import TenantYearMixin

class Ocorrencia(Base, TenantYearMixin):
    __tablename__ = "ocorrencias"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    tipo: Mapped[str] = mapped_column(String(50), nullable=False) # Advertência, Elogio, etc
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    data_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    aluno_id: Mapped[int] = mapped_column(ForeignKey("alunos.id"), nullable=False)
    autor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    aluno = relationship("Aluno")
    autor = relationship("Usuario")


    def to_dict(self):
        return {
            "id": self.id,
            "aluno_nome": self.aluno.nome if self.aluno else "Desconhecido",
            "aluno_id": self.aluno_id,
            "autor_nome": self.autor.username if self.autor else "Sistema",
            "tipo": self.tipo,
            "descricao": self.descricao,
            "data_registro": self.data_registro.isoformat()
        }
