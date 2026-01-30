# Arquitetura do Sistema - ColaboraFREI

## 📐 Visão Geral

O ColaboraFREI é uma plataforma moderna de gestão escolar construída com arquitetura de microserviços, utilizando tecnologias web modernas e containerização Docker.

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                              │
│  (Alunos, Professores, Administradores, Responsáveis)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Boletins    │  │  Ocorrências │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Comunicados │  │  AI Chat     │  │  Relatórios  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes (v1)                         │   │
│  │  /auth  /alunos  /turmas  /notas  /ocorrencias      │   │
│  │  /comunicados  /relatorios  /usuarios               │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │           Services Layer                             │   │
│  │  AlunoService  TurmaService  OcorrenciaService       │   │
│  │  UsuarioService  TenantService                       │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │         Repositories Layer                           │   │
│  │  AlunoRepository  TurmaRepository  etc.              │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │            Models (SQLAlchemy)                       │   │
│  │  Aluno  Turma  Nota  Ocorrencia  Usuario  Tenant    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   PostgreSQL     │      │      Redis       │
│  (Banco Dados)   │      │  (Cache/Queue)   │
└──────────────────┘      └──────────────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │   RQ Worker      │
                          │ (Background Jobs)│
                          └──────────────────┘
```

---

## 🏗️ Componentes Principais

### 1. Frontend (React + Vite)

**Tecnologias:**
- React 18
- TypeScript
- Vite (Build tool)
- TanStack Query (React Query)
- Recharts (Gráficos)
- Tailwind CSS
- Shadcn/ui (Componentes)

**Estrutura de Diretórios:**
```
frontend/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ui/           # Componentes base (shadcn)
│   │   └── layout/       # Layout components
│   ├── features/         # Features modulares
│   │   ├── ai-chat/      # Chat com IA
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── relatorios/   # Relatórios
│   │   └── ...
│   ├── lib/              # Utilitários
│   │   ├── api.ts        # Cliente API
│   │   └── utils.ts      # Funções auxiliares
│   ├── pages/            # Páginas da aplicação
│   └── main.tsx          # Entry point
├── public/               # Assets estáticos
└── package.json
```

**Principais Features:**
- Dashboard interativo com gráficos
- Gestão de alunos e turmas
- Sistema de notas e boletins
- Registro de ocorrências disciplinares
- Sistema de comunicados
- Chat com IA para análise de dados
- Portal do aluno
- Relatórios e exportações

---

### 2. Backend (Flask)

**Tecnologias:**
- Python 3.12
- Flask 3.x
- SQLAlchemy (ORM)
- Flask-Migrate (Migrações)
- Flask-CORS
- Flask-JWT-Extended (Autenticação)
- Pydantic (Validação)
- RQ (Background Jobs)

**Estrutura de Diretórios:**
```
backend/
├── app/
│   ├── __init__.py       # Factory pattern
│   ├── api/              # API endpoints
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── alunos.py
│   │       ├── turmas.py
│   │       ├── notas.py
│   │       ├── ocorrencias.py
│   │       └── ...
│   ├── models/           # SQLAlchemy models
│   │   ├── aluno.py
│   │   ├── turma.py
│   │   ├── nota.py
│   │   ├── ocorrencia.py
│   │   ├── usuario.py
│   │   └── tenant.py
│   ├── services/         # Business logic
│   │   ├── aluno_service.py
│   │   ├── turma_service.py
│   │   ├── ocorrencia_service.py
│   │   └── ...
│   ├── repositories/     # Data access layer
│   ├── schemas/          # Pydantic schemas
│   ├── core/             # Core utilities
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── handlers.py
│   │   └── middleware.py
│   └── utils/            # Helper functions
├── migrations/           # Alembic migrations
├── tests/                # Unit tests
└── pyproject.toml        # Dependencies
```

**Arquitetura em Camadas:**

1. **API Layer** (`api/v1/`): Endpoints REST
2. **Service Layer** (`services/`): Lógica de negócio
3. **Repository Layer** (`repositories/`): Acesso a dados
4. **Model Layer** (`models/`): Modelos de dados
5. **Schema Layer** (`schemas/`): Validação e serialização

---

### 3. Banco de Dados (PostgreSQL)

**Modelo de Dados Principal:**

```sql
-- Tenants (Multi-tenancy)
tenants
├── id (PK)
├── nome
├── slug
└── ativo

-- Usuários
usuarios
├── id (PK)
├── tenant_id (FK)
├── username
├── password_hash
├── role (admin/professor/aluno)
└── aluno_id (FK, nullable)

-- Alunos
alunos
├── id (PK)
├── tenant_id (FK)
├── nome
├── matricula
├── turma_id (FK)
└── responsavel_*

-- Turmas
turmas
├── id (PK)
├── tenant_id (FK)
├── nome
├── ano
└── serie

-- Notas
notas
├── id (PK)
├── tenant_id (FK)
├── aluno_id (FK)
├── disciplina
├── trimestre_1/2/3
├── media_final
├── faltas
└── status

-- Ocorrências
ocorrencias
├── id (PK)
├── tenant_id (FK)
├── aluno_id (FK)
├── tipo
├── descricao
├── data
└── autor_id (FK)

-- Comunicados
comunicados
├── id (PK)
├── tenant_id (FK)
├── titulo
├── conteudo
├── tipo_destinatario
├── turma_id (FK, nullable)
├── aluno_id (FK, nullable)
└── data_criacao

-- Audit Logs
audit_logs
├── id (PK)
├── tenant_id (FK)
├── usuario_id (FK)
├── acao
├── entidade
├── detalhes
└── timestamp
```

**Índices Importantes:**
- `idx_alunos_tenant_id`
- `idx_notas_aluno_id`
- `idx_ocorrencias_aluno_id`
- `idx_usuarios_username`

---

### 4. Redis

**Uso:**
- **Cache**: Resultados de queries frequentes
- **Queue**: Fila de jobs assíncronos (RQ)
- **Session Storage**: Sessões de usuário

**Filas:**
- `default`: Jobs gerais
- `pdf_processing`: Processamento de PDFs
- `email`: Envio de emails (futuro)

---

### 5. Worker (RQ)

**Responsabilidades:**
- Processamento assíncrono de PDFs
- Geração de relatórios pesados
- Cálculos em lote
- Envio de notificações (futuro)

---

## 🔐 Segurança

### Autenticação e Autorização

1. **JWT Tokens**: Autenticação stateless
2. **Role-Based Access Control (RBAC)**:
   - `admin`: Acesso total
   - `professor`: Visualização e edição limitada
   - `aluno`: Apenas visualização própria

3. **Multi-tenancy**: Isolamento de dados por tenant

### Proteções Implementadas

- CORS configurado
- SQL Injection prevention (SQLAlchemy ORM)
- XSS protection (sanitização de inputs)
- CSRF tokens (em desenvolvimento)
- Rate limiting (planejado)
- Password hashing (bcrypt)

---

## 🔄 Fluxo de Dados

### Exemplo: Registro de Ocorrência

```
1. Frontend (ChatWidget.tsx)
   └─> POST /api/v1/ocorrencias
       │
2. Backend (ocorrencias.py)
   └─> OcorrenciaService.create()
       │
3. Service Layer
   └─> Validação de dados
   └─> Verificação de permissões
   └─> Repository.save()
       │
4. Repository Layer
   └─> SQLAlchemy ORM
       │
5. Database
   └─> INSERT INTO ocorrencias
   └─> INSERT INTO audit_logs
       │
6. Response
   └─> JSON com ocorrência criada
       │
7. Frontend
   └─> Atualização da UI
   └─> Invalidação do cache (React Query)
```

---

## 📊 Padrões de Design

### 1. Repository Pattern
Abstração da camada de dados para facilitar testes e manutenção.

### 2. Service Layer Pattern
Lógica de negócio separada dos controllers.

### 3. Factory Pattern
Criação da aplicação Flask usando factory.

### 4. Dependency Injection
Injeção de dependências nos services.

### 5. DTO Pattern
Uso de Pydantic schemas para transferência de dados.

---

## 🚀 Performance

### Otimizações Implementadas

1. **Frontend**:
   - Code splitting (Vite)
   - Lazy loading de componentes
   - React Query para cache
   - Debounce em buscas

2. **Backend**:
   - Eager loading (SQLAlchemy)
   - Paginação em todas as listagens
   - Índices de banco de dados
   - Connection pooling

3. **Database**:
   - Índices otimizados
   - Queries otimizadas
   - EXPLAIN ANALYZE para análise

---

## 📈 Escalabilidade

### Horizontal Scaling

- **Frontend**: Servir via CDN
- **Backend**: Múltiplas instâncias atrás de load balancer
- **Database**: Read replicas
- **Redis**: Redis Cluster
- **Workers**: Múltiplos workers

### Vertical Scaling

- Aumentar recursos de containers
- Otimizar queries
- Aumentar connection pool

---

## 🔧 Monitoramento (Planejado)

- **Logs**: Estruturados em JSON
- **Métricas**: Prometheus + Grafana
- **APM**: Sentry para error tracking
- **Health Checks**: Endpoints `/health`

---

## 📝 Convenções de Código

### Backend (Python)

- PEP 8 style guide
- Type hints obrigatórios
- Docstrings em funções públicas
- Testes unitários com pytest

### Frontend (TypeScript)

- ESLint + Prettier
- Componentes funcionais
- Hooks customizados
- PropTypes com TypeScript

---

## 🔄 CI/CD (Planejado)

```yaml
Pipeline:
1. Lint & Format Check
2. Unit Tests
3. Integration Tests
4. Build Docker Images
5. Push to Registry
6. Deploy to Staging
7. E2E Tests
8. Deploy to Production
```

---

## 📚 Referências

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)
