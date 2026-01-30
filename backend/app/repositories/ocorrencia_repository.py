from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models import Ocorrencia
from app.repositories.base import BaseRepository

class OcorrenciaRepository(BaseRepository[Ocorrencia]):
    def __init__(self, session: Session):
        super().__init__(session, Ocorrencia)

    def list_filtered(self, aluno_id: Optional[int] = None) -> List[Ocorrencia]:
        from flask import g
        tenant_id = getattr(g, "tenant_id", None)
        academic_year_id = getattr(g, "academic_year_id", None)

        query = select(self.model).order_by(desc(self.model.data_registro))
        
        if tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        if academic_year_id:
            query = query.where(self.model.academic_year_id == academic_year_id)
        if aluno_id:
            query = query.where(self.model.aluno_id == aluno_id)
            
        return self.session.execute(query).scalars().all()
