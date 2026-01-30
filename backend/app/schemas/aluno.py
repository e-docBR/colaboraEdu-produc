from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class NotaBase(BaseModel):
    disciplina: str
    trimestre1: Optional[float] = None
    trimestre2: Optional[float] = None
    trimestre3: Optional[float] = None
    total: Optional[float] = None
    faltas: Optional[int] = 0
    situacao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class NotaSchema(NotaBase):
    id: int

class AlunoBase(BaseModel):
    matricula: str
    nome: str
    turma: str
    turno: str
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AlunoListSchema(AlunoBase):
    id: int
    media: Optional[float] = None
    faltas: Optional[int] = None
    status: Optional[str] = None


class AlunoDetailSchema(AlunoBase):
    id: int
    notas: List[NotaSchema] = []
    media: Optional[float] = None

class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    pages: int

class AlunoCreate(AlunoBase):
    pass

class AlunoUpdate(BaseModel):
    matricula: Optional[str] = None
    nome: Optional[str] = None
    turma: Optional[str] = None
    turno: Optional[str] = None
    status: Optional[str] = None

class AlunoPaginatedResponse(BaseModel):
    items: List[AlunoListSchema]
    meta: PaginationMeta

