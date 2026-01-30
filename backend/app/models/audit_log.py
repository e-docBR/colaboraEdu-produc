from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from ..core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Nullable if system action
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE, LOGIN, EXPORT
    target_type = Column(String(50), nullable=False) # Nota, Aluno, Usuario, Ocorrencia
    target_id = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True) # Diff or snapshot
    timestamp = Column(DateTime, default=datetime.now)

    usuario = relationship("Usuario")

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.usuario.username if self.usuario else "Sistema",
            "action": self.action,
            "target": f"{self.target_type} {self.target_id or ''}".strip(),
            "details": self.details,
            "timestamp": self.timestamp.isoformat()
        }
