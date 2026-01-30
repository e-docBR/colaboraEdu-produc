# Guia de Deployment - ColaboraFREI

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deployment com Docker (Recomendado)](#deployment-com-docker-recomendado)
3. [Deployment Manual](#deployment-manual)
4. [Configuração de Ambiente](#configuração-de-ambiente)
5. [Troubleshooting](#troubleshooting)
6. [Manutenção](#manutenção)

---

## 🔧 Pré-requisitos

### Para Deployment com Docker
- **Docker Engine**: 24.0+
- **Docker Compose**: 2.20+
- **Memória RAM**: Mínimo 2GB disponível
- **Espaço em Disco**: Mínimo 5GB disponível

### Para Deployment Manual
- **Python**: 3.12+
- **Node.js**: 18+
- **PostgreSQL**: 15+
- **Redis**: 7+
- **npm** ou **pnpm**

---

## 🐳 Deployment com Docker (Recomendado)

### Modo Desenvolvimento

```bash
# 1. Clone o repositório
git clone <repository-url>
cd colaboraFREI

# 2. Inicie os containers
docker-compose up -d --build

# 3. Verifique o status
docker-compose ps

# 4. Acesse a aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### Modo Produção

```bash
# 1. Configure as variáveis de ambiente
export POSTGRES_PASSWORD="sua_senha_segura"

# 2. Inicie os containers de produção
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Verifique o status
docker-compose -f docker-compose.prod.yml ps

# 4. Acesse a aplicação
# Frontend: http://localhost:8090
```

### Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar um serviço
docker-compose restart backend

# Parar todos os containers
docker-compose down

# Parar e remover volumes (⚠️ APAGA DADOS)
docker-compose down -v

# Executar comandos no container
docker-compose exec backend flask --app app init-db
docker-compose exec backend flask --app app seed-demo
```

---

## 🔨 Deployment Manual

### 1. Backend (Flask)

```bash
cd backend

# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# Instalar dependências
pip install -e .[dev]

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicializar banco de dados
flask --app app init-db

# (Opcional) Carregar dados de demonstração
flask --app app seed-demo

# Iniciar servidor de desenvolvimento
flask --app app run --debug --host 0.0.0.0 --port 5000

# Para produção, use Gunicorn
gunicorn --bind 0.0.0.0:5000 "app:create_app()"
```

### 2. Frontend (React/Vite)

```bash
cd frontend

# Instalar dependências
npm install
# ou
pnpm install

# Configurar variáveis de ambiente (opcional)
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env

# Iniciar servidor de desenvolvimento
npm run dev -- --host --port 5173

# Para produção, fazer build
npm run build
# Os arquivos estarão em dist/
```

### 3. Banco de Dados (PostgreSQL)

```bash
# Criar banco de dados
createdb colabora_edu

# Ou via psql
psql -U postgres
CREATE DATABASE colabora_edu;
\q
```

### 4. Redis

```bash
# Iniciar Redis
redis-server

# Ou com Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. Worker (Background Jobs)

```bash
cd backend
source .venv/bin/activate

# Iniciar worker
rq worker default --url redis://localhost:6379/0
```

---

## ⚙️ Configuração de Ambiente

### Variáveis de Ambiente - Backend

Crie um arquivo `.env` no diretório `backend/`:

```env
# Flask
FLASK_APP=app
FLASK_DEBUG=1  # 0 para produção
SECRET_KEY=sua_chave_secreta_aqui

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/colabora_edu

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# Upload
UPLOAD_FOLDER=/data/uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

### Variáveis de Ambiente - Frontend

Crie um arquivo `.env` no diretório `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Variáveis de Ambiente - Docker Compose

Para produção, você pode criar um arquivo `.env` na raiz do projeto:

```env
POSTGRES_PASSWORD=senha_super_segura
ALLOWED_ORIGINS=["https://seu-dominio.com"]
```

---

## 🔍 Troubleshooting

### Problema: Containers não iniciam

```bash
# Verificar logs
docker-compose logs

# Limpar containers antigos
docker-compose down -v
docker system prune -a

# Reconstruir
docker-compose up -d --build
```

### Problema: Erro de conexão com banco de dados

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Testar conexão
docker-compose exec postgres psql -U postgres -d colabora_edu
```

### Problema: Frontend não conecta ao Backend

1. Verifique se o backend está rodando: `curl http://localhost:5000/health`
2. Verifique as configurações de CORS no backend
3. Verifique a variável `VITE_API_BASE_URL` no frontend

### Problema: Erro nas migrações

```bash
# Inicializar banco manualmente
docker-compose exec backend flask --app app init-db

# Ou criar migração
docker-compose exec backend flask db init
docker-compose exec backend flask db migrate -m "Initial migration"
docker-compose exec backend flask db upgrade
```

### Problema: Worker não processa jobs

```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Verificar logs do worker
docker-compose logs worker

# Reiniciar worker
docker-compose restart worker
```

---

## 🔧 Manutenção

### Backup do Banco de Dados

```bash
# Backup com Docker
docker-compose exec postgres pg_dump -U postgres colabora_edu > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres colabora_edu < backup_20260113.sql
```

### Atualização do Sistema

```bash
# 1. Fazer backup
docker-compose exec postgres pg_dump -U postgres colabora_edu > backup_pre_update.sql

# 2. Parar containers
docker-compose down

# 3. Atualizar código
git pull origin main

# 4. Reconstruir e iniciar
docker-compose up -d --build

# 5. Verificar logs
docker-compose logs -f
```

### Limpeza de Logs

```bash
# Limpar logs do Docker
docker-compose logs --no-log-prefix > logs_backup.txt
docker system prune -a --volumes

# Limpar uploads antigos (cuidado!)
docker-compose exec backend find /data/uploads -type f -mtime +90 -delete
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker-compose logs -f --tail=100

# Verificar saúde dos serviços
docker-compose ps
curl http://localhost:5000/health
```

---

## 🚀 Deployment em Produção

### Checklist de Segurança

- [ ] Alterar `SECRET_KEY` para valor aleatório e seguro
- [ ] Alterar senha do PostgreSQL (`POSTGRES_PASSWORD`)
- [ ] Configurar `FLASK_DEBUG=0`
- [ ] Configurar CORS com domínios específicos
- [ ] Usar HTTPS (configurar reverse proxy como Nginx)
- [ ] Configurar firewall (permitir apenas portas necessárias)
- [ ] Configurar backup automático do banco de dados
- [ ] Configurar logs centralizados
- [ ] Implementar rate limiting
- [ ] Configurar monitoramento (ex: Prometheus + Grafana)

### Exemplo de Configuração Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📞 Suporte

Para problemas ou dúvidas:
- Consulte a documentação completa em `/docs`
- Verifique os logs: `docker-compose logs -f`
- Abra uma issue no repositório do projeto
