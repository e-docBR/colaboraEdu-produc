from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.repositories.ocorrencia_repository import OcorrenciaRepository
from app.schemas.ocorrencia import OcorrenciaSchema, OcorrenciaCreate, OcorrenciaUpdate
from app.services.audit import log_action

class OcorrenciaService:
    def __init__(self, session: Session, user_id: int):
        self.repository = OcorrenciaRepository(session)
        self.user_id = user_id

    def list_ocorrencias(self, aluno_id: Optional[int] = None) -> List[OcorrenciaSchema]:
        """
        Lists occurrences. Access control should be handled by the caller/controller 
        to decide IF the user can see this aluno_id, but the service handles the filtering.
        """
        results = self.repository.list_filtered(aluno_id)
        
        # Manually mapping to Schema to include convenient strings
        # Ideally this should be done by the schema or a mapper function
        schemas = []
        for o in results:
            schemas.append(OcorrenciaSchema(
                id=o.id,
                aluno_id=o.aluno_id,
                autor_id=o.autor_id,
                tipo=o.tipo,
                descricao=o.descricao,
                resolvida=o.resolvida,
                data_ocorrencia=o.data_ocorrencia,
                created_at=o.created_at,
                aluno_nome=o.aluno.nome if o.aluno else "Desconhecido",
                autor_nome=o.autor.username if o.autor else "Sistema"
            ))
        return schemas

    def create(self, data: OcorrenciaCreate) -> OcorrenciaSchema:
        dt = datetime.now()
        if data.data_ocorrencia:
             try:
                dt = datetime.fromisoformat(data.data_ocorrencia)
             except:
                pass

        payload = {
            "aluno_id": data.aluno_id,
            "autor_id": self.user_id,
            "tipo": data.tipo,
            "descricao": data.descricao,
            "data_ocorrencia": dt,
            "resolvida": data.resolvida
        }
        
        novo = self.repository.create(payload)

        # Audit
        log_action(
            self.repository.session, 
            self.user_id, 
            "CREATE", 
            "Ocorrencia", 
            novo.id, 
            {"tipo": novo.tipo, "aluno_id": novo.aluno_id}
        )
        
        # Return summary schema (we might need to reload to get relationships for names)
        # For performance we can just return what we have or reload
        # self.repository.session.refresh(novo) # Already done in create
        return OcorrenciaSchema(
             id=novo.id,
                aluno_id=novo.aluno_id,
                autor_id=novo.autor_id,
                tipo=novo.tipo,
                descricao=novo.descricao,
                resolvida=novo.resolvida,
                data_ocorrencia=novo.data_ocorrencia,
                created_at=novo.created_at,
                aluno_nome=novo.aluno.nome if novo.aluno else "Desconhecido", # might fail if not eager loaded
                autor_nome="Eu" # Simplified for create response or force reload
        )

    def update(self, id: int, data: OcorrenciaUpdate) -> Optional[OcorrenciaSchema]:
        existing = self.repository.get(id)
        if not existing:
            return None

        update_data = data.model_dump(exclude_unset=True)
        updated = self.repository.update(existing, update_data)
        
        # Audit
        log_action(
            self.repository.session, 
            self.user_id, 
            "UPDATE", 
            "Ocorrencia", 
            updated.id, 
            {"updated_fields": list(update_data.keys())}
        )
        
        return OcorrenciaSchema(
                id=updated.id,
                aluno_id=updated.aluno_id,
                autor_id=updated.autor_id,
                tipo=updated.tipo,
                descricao=updated.descricao,
                resolvida=updated.resolvida,
                data_ocorrencia=updated.data_ocorrencia,
                created_at=updated.created_at,
                aluno_nome=updated.aluno.nome if updated.aluno else "Desconhecido",
                autor_nome=updated.autor.username if updated.autor else "Sistema"
        )

    def delete(self, id: int) -> bool:
        success = self.repository.delete(id)
        if success:
            log_action(
                self.repository.session, 
                self.user_id, 
                "DELETE", 
                "Ocorrencia", 
                id, 
                {"deleted": True}
            )
        return success
