"""Usuario model."""
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="professor")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    aluno_id: Mapped[int | None] = mapped_column(ForeignKey("alunos.id"), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    aluno = relationship("Aluno", back_populates="usuario")
    tenant = relationship("Tenant", back_populates="usuarios")

    @property
    def tenant_name(self) -> str | None:
        return self.tenant.name if self.tenant else None
