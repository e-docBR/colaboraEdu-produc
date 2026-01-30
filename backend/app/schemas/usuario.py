from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class AlunoSimpleSchema(BaseModel):
    id: int
    nome: str
    matricula: str
    turma: str
    turno: str
    
    model_config = ConfigDict(from_attributes=True)

class UsuarioSchema(BaseModel):
    id: int
    username: str
    role: Optional[str] = "professor"
    is_admin: bool = False
    aluno_id: Optional[int] = None
    photo_url: Optional[str] = None
    must_change_password: bool = False
    tenant_id: Optional[int] = None
    tenant_name: Optional[str] = None
    aluno: Optional[AlunoSimpleSchema] = None

    model_config = ConfigDict(from_attributes=True)

class UsuarioCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = "professor"
    is_admin: bool = False
    aluno_id: Optional[int] = None
    must_change_password: bool = True

class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    aluno_id: Optional[int] = None
    must_change_password: Optional[bool] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    tenant_slug: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UsuarioSchema

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
