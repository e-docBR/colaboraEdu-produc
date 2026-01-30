# 🎓 ColaboraFREI - Plataforma de Gestão Escolar

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

Plataforma moderna e completa para gestão escolar com backend Flask e frontend React/Vite, incluindo sistema de boletins, ocorrências disciplinares, comunicados e análise de dados com IA.

---

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Início Rápido](#-início-rápido)
- [Documentação](#-documentação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Características

### 🎯 Funcionalidades Principais

- **📊 Dashboard Interativo**: Visualização de dados com gráficos e estatísticas em tempo real
- **📝 Gestão de Boletins**: Sistema completo de notas, médias e status acadêmico
- **👥 Gestão de Alunos e Turmas**: Cadastro e organização de estudantes
- **⚠️ Ocorrências Disciplinares**: Registro de advertências, elogios e suspensões
- **📢 Sistema de Comunicados**: Envio de avisos para escola, turmas ou alunos específicos
- **🤖 Chat com IA**: Análise inteligente de dados escolares
- **📈 Relatórios Avançados**: Geração de relatórios personalizados
- **🔐 Multi-Tenancy**: Suporte para múltiplas escolas na mesma instalação
- **👤 Portal do Aluno**: Interface dedicada para estudantes e responsáveis

### 🎨 Recursos Técnicos

- **Arquitetura em Camadas**: Service Layer, Repository Pattern, DTO Pattern
- **API RESTful**: Endpoints bem documentados e padronizados
- **Autenticação JWT**: Sistema seguro de autenticação e autorização
- **Background Jobs**: Processamento assíncrono com Redis e RQ
- **Docker Ready**: Containerização completa para fácil deployment
- **Responsive Design**: Interface adaptável para desktop, tablet e mobile

---

## 🛠️ Tecnologias

### Backend
- **Python 3.12** - Linguagem principal
- **Flask 3.x** - Framework web
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL 15** - Banco de dados relacional
- **Redis 7** - Cache e fila de jobs
- **RQ** - Background job processing
- **Pydantic** - Validação de dados
- **Flask-JWT-Extended** - Autenticação

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TanStack Query** - Gerenciamento de estado e cache
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes UI
- **Recharts** - Biblioteca de gráficos

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx** - Servidor web (produção)
- **Gunicorn** - WSGI server (produção)

---

## 🚀 Início Rápido

### Pré-requisitos

- Docker Engine 24+ e Docker Compose 2.20+
- OU Python 3.12+, Node.js 18+, PostgreSQL 15+, Redis 7+

### Instalação com Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/colaboraFREI.git
cd colaboraFREI

# 2. Inicie os containers
docker-compose up -d --build

# 3. Aguarde a inicialização (1-2 minutos)
docker-compose logs -f

# 4. Acesse a aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### Instalação Manual

Consulte o [Guia de Deployment](docs/DEPLOYMENT.md) para instruções detalhadas de instalação manual.

---

## 📚 Documentação

- **[Guia de Deployment](docs/DEPLOYMENT.md)** - Instruções completas de instalação e deployment
- **[Arquitetura do Sistema](docs/ARCHITECTURE.md)** - Documentação técnica da arquitetura
- **[CHANGELOG](CHANGELOG.md)** - Histórico de versões e mudanças

### Endpoints da API

A API está disponível em `http://localhost:5000/api/v1` com os seguintes endpoints principais:

- `POST /auth/login` - Autenticação de usuários
- `GET /alunos` - Listar alunos
- `GET /turmas` - Listar turmas
- `GET /notas` - Listar notas
- `POST /ocorrencias` - Criar ocorrência
- `GET /comunicados` - Listar comunicados
- `GET /relatorios` - Gerar relatórios

---

## 📁 Estrutura do Projeto

```
colaboraFREI/
├── backend/              # API Flask
│   ├── app/
│   │   ├── api/         # Endpoints REST
│   │   ├── models/      # Modelos SQLAlchemy
│   │   ├── services/    # Lógica de negócio
│   │   ├── repositories/# Acesso a dados
│   │   ├── schemas/     # Validação Pydantic
│   │   └── core/        # Configurações e utilitários
│   ├── migrations/      # Migrações do banco
│   └── tests/           # Testes unitários
│
├── frontend/            # SPA React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── features/    # Features modulares
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários e API client
│   └── public/          # Assets estáticos
│
├── docs/                # Documentação
├── data/                # Uploads e dados locais
├── docker-compose.yml   # Desenvolvimento
├── docker-compose.prod.yml # Produção
└── README.md
```

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar um serviço
docker-compose restart backend

# Executar comandos no container
docker-compose exec backend flask --app app init-db
docker-compose exec backend flask --app app seed-demo

# Parar todos os containers
docker-compose down

# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres colabora_edu > backup.sql
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Equipe ColaboraFREI** - *Desenvolvimento inicial*

---

## 🙏 Agradecimentos

- Comunidade Flask e React
- Contribuidores open source
- Instituições educacionais parceiras

---

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma [issue](https://github.com/seu-usuario/colaboraFREI/issues)
- Consulte a [documentação](docs/)
- Entre em contato: suporte@colaborafrei.com

---

**Desenvolvido com ❤️ para educação**
