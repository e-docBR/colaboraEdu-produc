from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class OcorrenciaBase(BaseModel):
    tipo: str
    descricao: str
    data_registro: Optional[datetime] = None

class OcorrenciaCreate(OcorrenciaBase):
    aluno_id: int
    data_registro: Optional[str] = None # Accepts ISO string from frontend

class OcorrenciaUpdate(BaseModel):
    tipo: Optional[str] = None
    descricao: Optional[str] = None

class OcorrenciaSchema(OcorrenciaBase):
    id: int
    aluno_id: int
    autor_id: int
    
    # Extra fields for display
    aluno_nome: str
    autor_nome: str

    model_config = ConfigDict(from_attributes=True)
