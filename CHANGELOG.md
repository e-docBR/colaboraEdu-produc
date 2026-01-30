# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-27

### 🚀 Added
- **🎓 Student Status Management**:
    - New field **"Situação Especial"** added to student records.
    - Supported statuses: **Cancelado**, **Transferido**, and **Desistente**.
    - **Smart Analytics**: Inactive students (those with a special status) are now automatically excluded from global averages, student counts, and performance charts to ensure data accuracy.
    - **Visual Indicators**: Specific badges added to student cards, class lists, and individual reports to highlight special situations.

### 🛡️ Access Control & RBAC
- **Expanded Administrative Autonomy**:
    - **Coordenador**, **Diretor**, and **Orientador** profiles now have full access to Create, Edit, and Delete student records.
    - Previously restricted to pure `admin`, this change empowers the pedagogical team for daily student management.

### 🔧 Technical
- **Database Schema**: Successfully updated `alunos` table with the new `status` column.
- **REST API**: Enhanced student and grade serialization to include status metadata across all relevant endpoints.
- **UX**: Unified status formatting logic between Turma and Aluno detail pages for better visual consistency.

## [1.0.0] - 2026-01-27

### 🚀 Added
- **🛡️ Advanced RBAC (Role-Based Access Control)**:
    - New profiles: **Orientador** and **Diretor** added to the management ecosystem.
    - Specialized permissions: Coordenadores, Orientadores, and Diretores now have full management access to **Mural de Avisos** (Comunicados) and **Ocorrências**.
    - Restricted access: Technical management of user accounts is now exclusive to `admin` and `super_admin` roles.
- **📊 Teacher Dashboard Modernization**:
    - New KPIs: **Total Students** and **Global Average** added for quick pedagogical insights.
    - Improved Grade Distribution: Now reflects student average performance instead of raw grade counts.
    - Refined UI/UX with modern aesthetics, glassmorphism elements, and improved tooltip clarity.

### 🔧 Fixes & Stability
- **🛡️ Multi-Tenant Engineering**:
    - **Data Integrity**: Optimized ORM filters to ensure strict institution isolation while supporting safe super-admin access.
    - **User Creation**: Newly created users now automatically inherit the institution context of the creator, preventing "orphan" users.
    - **Database Migrations**: Executed data sanitation to link existing users to their respective institutions.
- **⚡ Login & Auth Experience**:
    - **Error Handling**: Enhanced UI to display detailed server validation messages (e.g., minimum password length).
    - **MUI Stability**: Fixed "out-of-range" warnings in the school selector caused by race conditions during loading.
    - **Session Recovery**: Improved tenant slug resolution during login to ensure a smoother entry experience.

### 🚀 Added (Previous 0.9.3 highlights)
- **🔍 Advanced Search Engine**:
    - TopBar search is now fully functional and synchronized with URL query parameters (`?q=...`).
    - Redirects to Alunos page automatically when searching from the Dashboard.
- **🖱️ Interactive Reports**:
    - Student names in all list views (Classes, Teacher Dashboard) are now clickable links to full student reports.

### 🔧 Fixes & Stability
- **🛡️ Multi-Tenant Engineering**:
    - Fixed mandatory ORM filtering for functional queries (`count`, `avg`, `distinct`) ensuring 100% data isolation in Dashboard KPIs.
    - Resolved "MultipleResultsFound" crash in dashboard services by enforcing scalar results.
- **⚡ Background Processing**:
    - **Worker Resilience**: Improved Redis connection stability for PDF ingestion with automated retries and socket timeouts.
    - **Proactive Monitoring**: Frontend now detects if the worker is offline and provides real-time feedback to users during uploads.
- **🎨 UI/UX Refinements**:
    - **Dynamic Branding**: Sidebar now dynamically displays the institution's name and initials.
    - **Smart Login**: Conditionally hides the "Central / Super Admin" option for student/responsible profiles.
- **📈 Performance**:
    - Implemented eager loading for tenant relationships in `/usuarios/me`, reducing API latency.

## [0.9.2] - 2026-01-27

### 🔧 Fixes
- **🚨 CRITICAL: Production System Restored**:
    - Fixed Traefik configuration to correctly route traffic to the frontend container.
    - Added missing `traefik.http.services.colaborafrei.loadbalancer.server.port=80` label.
    - Frontend now correctly uses Nginx production build instead of Vite dev server.
    - Resolved HTTP 403/521 errors preventing access to the production system.
- **🛡️ Global Multi-Tenant Enforcement**:
    - Implemented `before_request` hook in API v1 blueprint for automatic tenant/year resolution.
    - Removed redundant `@tenant_required()` decorators from individual endpoints.
    - Fixed data isolation bug where dashboard was showing aggregated data from all academic years.

## [0.9.1] - 2026-01-27

### 🚀 Added
- **📅 Automatic Academic Year Extraction**:
    - The ingestion service now automatically detects the school year (e.g., 2025) directly from the PDF header ("BOLETIM ESCOLAR - 2025").
    - **Auto-Provisioning**: Creates the `AcademicYear` record automatically if it doesn't exist for the institution, ensuring seamless historical data import.
- **🛠️ Bulk Data Recovery (CLI)**:
    - New `reprocess-pdfs` command added to the CLI to recursively re-ingest all existing documents in the cloud storage.
    - Useful for cleaning up and migration of historical data after system logic updates.
- **🛡️ Docker Networking Resilience**:
    - Implemented a dynamic DNS resolver and upstream variables in Nginx.
    - Resolves "502 Bad Gateway" errors during backend restarts by preventing IP caching in the frontend proxy.
- **🏗️ Multi-Tenant Robustness**:
    - Added a fallback mechanism in `TenantService` to the `default` slug, ensuring system stability even during complex domain migrations.
    - Improved context propagation (Tenant/Year) for background jobs in the RQ Worker.

### 🔧 Fixes
- Fixed "Inquilino não identificado" error during PDF uploads.
- Resolved database integrity violations in the worker when processing multi-tenant data.

## [0.9.0] - 2026-01-27

### 🚀 Added
- **🌐 Hetzner Cloud Infrastructure**: 
    - Full deployment plan for Hetzner VPS environment.
    - Automated SSL certificates via **Traefik Proxy** with Let's Encrypt integration.
    - Production-grade `.env.production` template with automated secret generation.
- **🛠️ DevOps & CLI Enancements**:
    - **Docker Compose V2 Support**: Optimized orchestration for modern Docker environments.
    - **Database Management CLI**: 
        - New `drop-db` command for safe environment resets.
        - Enhanced `seed-demo` command now automatically provisions mandatory `Tenant` and `AcademicYear` data.
- **🛡️ Infrastructure Hardening**:
    - Implemented **ProxyFix** middleware in Flask to correctly resolve client IPs and HTTPS protocols behind Traefik.
    - Automated SSH key provisioning for secure server management.

### 🔧 Fixes
- **🎨 Frontend Build Corrections**:
    - Fixed TypeScript errors in `api.ts` related to `Comunicado` target types.
    - Resolved JSX duplicate attribute error in `GraficosPage.tsx` preventing production builds.
    - Synchronized `Chart` types with backend multi-tenant data structures.

## [0.8.0] - 2026-01-26

### 🚀 Added
- **🏫 Multi-Tenancy & School Isolation**: 
    - Full architectural support for multiple schools on a single instance.
    - Automated data isolation via `TenantYearMixin` in the ORM.
    - Staged database migration for safe transition of existing data.
- **📅 Academic Year Management**:
    - New `AcademicYear` module for logical separation of school cycles.
    - **Global Year Selector**: Added to the TopBar for seamless switching between current and historical data.
    - **Year Filtering**: Automated backend filtering for all modules (Alunos, Notas, Comunicados, Ocorrências).
    - **Session Persistence**: Academic year state managed via global Redux `appSlice`.
- **🛠️ Super Admin Module**:
    - Centralized management of schools (tenants) and academic cycles.
    - Security-hardened endpoints for SaaS operations.

### 🔧 Technical
- **🛡️ Secure ORM Filters**: Implemented `do_orm_execute` hooks for mandatory tenant and year scoping with specific bypasses for global admin access.
- **🔗 Profile Synchronization**: New `/usuarios/me` endpoint to dynamically resolve student profiles based on the active year.
- **🐛 Bug Fixes**:
    - Fixed login issues related to password hashing for new superadmin accounts.
    - Resolved profile-loading conflicts for global admins in multi-tenant contexts.
    - Removed legacy default credentials from the login screen for better security.

## [0.7.0] - 2026-01-26

### 🚀 Added
- **📱 Mobile First Overhaul**:
    - Implemented **Responsive Drawer Navigation**: Sidebar now automatically converts to a slide-out drawer on mobile devices.
    - **Hamburger Menu**: Added an interactive toggle in the TopBar for small screens.
    - **Adaptive Dashboards**: KPIs and charts now reflow dynamically, with optimized heights for scrolling on smartphones.
    - **Smart Tables**: Implemented column prioritization in the User Management table to hide non-essential data on mobile, ensuring a clean, legible interface.
    - **UI Optimization**: Streamlined the TopBar by hiding less critical info on small devices to maximize content workspace.

### 🔧 Fixes & Enhancements
- **📐 Layout Consistency**: Standardized spacing and transitions across the dashboard layout to eliminate layout shifts during sidebar toggling.
- **⚡ Performance**: Optimized chart rendering for mobile GPU acceleration.

## [0.6.0] - 2026-01-26


### 🚀 Added
- **🤖 AI FreiRonaldo (Advanced Analytics)**:
    - Rebranded and enhanced the AI Assistant with over 20 analytical intents.
    - Added support for **multimodal responses**: Automated Pie Charts for status and Bar Charts for performance/attendance.
    - New deep-analysis features: **Radar de Abandono** (Dropout Radar) and **Missing Grades** detection.
    - Improved natural language processing for Turma recognition (e.g., "6A", "7º ANO B") and student profile lookups.
    - Integrated support for **Mural (Notices)** and **Occurrences** in chat queries.

### 🔧 Fixes & Enhancements
- **🎨 UI/UX Cleanups**: Removed the redundant global search from the Dashboard TopBar to streamline navigation.
- **🛡️ Robust Regex Matching**: Fixed backend NLP issues with accented characters and specific school academic terms.
- **📊 Real-time Chat Sync**: Updated RTK Query hooks and frontend types to support complex AI-generated datasets.

## [0.5.1] - 2026-01-26


### 🔧 Fixes & Enhancements
- **📊 Business Logic Update**: Adjusted the **"Em Risco" (At Risk)** KPI threshold from 60 to **50**. This aligns the dashboard metrics with conservative academic criteria, reducing false positives in risk reporting.

## [0.5.0] - 2026-01-26


### 🚀 Added
- **Student Management (CRUD)**:
    - Implemented full Creation, Update, and Deletion of students.
    - Added `AlunoForm` component for administrative tasks.
    - Integrated edit and delete actions in `AlunoDetailPage`.
    - Backend support with new schemas, services, and endpoints for student persistence.

### 🔧 Fixes & Enhancements
- **🔍 Global Search**: Migrated student search to server-side, enabling discovery of any student in the database regardless of pagination.
- **🎨 Sidebar Visibility**: Fixed contrast issue in Light Mode where the active menu item label would become invisible.
- **📊 Real-time Dashboard Sync**: Configured RTK Query tag invalidation to ensure student counts and averages are updated instantly after CRUD operations.

## [0.4.1] - 2026-01-26


### 🔧 Technical & Bug Fixes
- **🎨 Shared Theme System**: Implemented `ThemeContext` and global `AppThemeProvider` to ensure dark mode is synchronized across all components.
- **📊 Student Analytics Fix**: 
    - Corrected student cards in "Alunos" page to display the arithmetic average of all disciplines.
    - Updated backend repositories and services to calculate real-time averages and total absences during student listing.
    - Sincronized 100-point scale thresholds (Risk < 60) across dashboard, listing, and color logic.
- **🛠️ Refactoring**:
    - Replaced `id` based routing with `slug` in TurmasPage to resolve TypeScript lint errors.
    - Standardized field names (`media`, `alunos_em_risco`) across API and frontend.

## [0.4.0] - 2026-01-26


### 🚀 Added
- **Intelligent Reporting Engine**:
    - **Radar de Abandono**: Predictive report identifying students at high risk of dropout based on attendance and grade trends.
    - **Top Movers**: Trend analysis identifying students with significant performance shifts (up/down).
    - **Eficiência Docente**: Diagnostic report comparing Class vs School averages per discipline.
- **Client-Side Analytics**:
    - Implemented `selectors.ts` for real-time data derivation (Risk Score, Trend Delta).
- **Enhanced Visualizations**:
    - Added support for `Area`, `Scatter`, and `Bar` charts in the reporting module.
    - Integrated `recharts` for dynamic data visualization.

### 🎨 UI/UX Improvements
- **Mural de Avisos**: Redesigned as a modern, social-media style feed with pinned items and semantic icons.
- **Ocorrências**: Transformed into a card-based interface with visual status indicators (Resolved/Pending).
- **Boletim Escolar**: Modernized DataGrid with conditional grade formatting (Red/Amber/Green).

### 🔧 Technical
- **Codebase Optimization**:
    - Migrated report configurations to `config.tsx` to support JSX rendering.
    - Refactored `GraficosPage` and `RelatorioDetailPage` for better component separation and rendering logic.

## [0.2.0] - 2026-01-13

### 🚀 Added
- **Multi-Tenancy Architecture**:
    - Implementação completa de sistema multi-tenant
    - Modelo `Tenant` para isolamento de dados
    - Middleware de tenant context
    - Migrations para suporte a multi-tenancy

- **Arquitetura em Camadas**:
    - **Service Layer**: Lógica de negócio separada (AlunoService, TurmaService, OcorrenciaService, etc.)
    - **Repository Layer**: Abstração de acesso a dados
    - **Schema Layer**: Validação com Pydantic (AlunoSchema, OcorrenciaSchema, etc.)
    - **Exception Handling**: Sistema centralizado de tratamento de erros
    - **Middleware**: Request logging e tenant context

- **Docker Production Support**:
    - `docker-compose.prod.yml` para deployment em produção
    - `Dockerfile.prod` para frontend com Nginx
    - `nginx.conf` para servir frontend otimizado
    - `entrypoint.sh` para inicialização automática de migrações
    - Health checks em todos os serviços

- **Documentação Completa**:
    - `docs/DEPLOYMENT.md`: Guia completo de deployment
    - `docs/ARCHITECTURE.md`: Documentação da arquitetura do sistema
    - Instruções para Docker e deployment manual
    - Troubleshooting e manutenção

### 🔧 Changed
- **Backend Refactoring**:
    - Migração para arquitetura em camadas
    - Separação de responsabilidades (SRP)
    - Melhoria na organização de código
    - Padronização de respostas de API

- **Database Improvements**:
    - Adição de campo `tenant_id` em todas as tabelas principais
    - Índices otimizados para queries multi-tenant
    - Migrations organizadas e versionadas

- **API Enhancements**:
    - Endpoints mais consistentes
    - Melhor tratamento de erros
    - Validação de dados com Pydantic
    - Paginação otimizada

### 🐛 Fixed
- Correção de erro de migração do Alembic (alembic.ini)
- Inicialização automática do banco de dados via entrypoint
- Problemas de CORS em produção
- Isolamento de dados entre tenants

### 📚 Documentation
- Guia completo de deployment (desenvolvimento e produção)
- Documentação de arquitetura com diagramas
- Troubleshooting guide
- Convenções de código e padrões de design

## [Unreleased]
### Added
- **Dashboard Improvements**:
    - Updated "Média Geral" card label to "Média dos Totais" for clarity.
    - Added "Comparativo de médias por disciplina" (Subject Averages) BarChart to Dashboard.
    - Updated "Situação Geral" PieChart to specific categories: Aprovado, Reprovado, Outros.
    - Removed "Evolução das médias trimestrais" LineChart.

### Added
- **Ocorrências System Improvements**:
    - Fixed pagination issue in `api/v1/alunos` ensuring all students appear in the selection dropdown.
    - Added database migration for `ocorrencias` table.
    - Resolved `redis` dependency missing in backend environment.

### Added
- **Phase 6 (Data Corrections)**:
    - **Grade Editing**: Admins can now manually edit grades, absences, and status via the Student Details page.
    - **Audit Log**: All mutations are logged for security (showing old vs new values).
    - **Auto-Calculation**: Editing trimesters automatically recalculates the total if not manually overridden.
    - **Access Control**: Strict `admin` role requirement for data modification.
    - **Student Portal ('Meu Boletim')**: Added Tabs for specialized views:
        - **Boletim**: Grades and absence view.
        - **Ocorrências**: Personal disciplinary records.
        - **Recados**: Targeted communications (filtered to show only Class or Student specific messages).
- **Phase 5 (Advanced)**:
    - **Ocorrências Disciplinares**: Module to register warnings, compliments, and suspensions.
    - **Audit Logs**: Security tracking for critical actions (create/edit).
    - **Advanced AI Analyst**:
        - **Rich Visual Responses**: Chat now renders **Interactive Charts** (Bar) and **Data Tables** directly in the conversation flow.
        - **New Analytical Intents**:
            - *"Hardest Subjects"*: Identifies disciplines with lowest averages.
            - *"Status Distribution"*: Visual breakdown of APR/REP/REC.
            - *"Best Students"*: Top performing students ranking.
            - *"Performance Analysis"*: Lists students above/below global average.
    - **Teacher Dashboard**: Analytics view for teachers (grade distribution, risk alerts).
    - **Risk Engine**: Machine Learning model (Logistic Regression) to predict student failure risk.
- **Phase 6 (Data Corrections & Admin)**:
    - **Audit Logs UI**: Dedicated page for admins to view system logs.
- **Phase 4 (Communication)**:
    - **Comunicados**: Announcement system targeting School (Todos), Class (Turma), or Individual Students.
    - **Portal**: Notification center for students/guardians.
- **Phase 3 (Intelligence)**:
    - **Teacher Dashboard**: Analytics view for teachers (grade distribution, risk alerts).
    - **Risk Engine**: Machine Learning model (Logistic Regression) to predict student failure risk.
- **Infrastructure**:
    - **Docker Support**: `docker-compose.yml` for full-stack orchestration (Backend, Frontend, Postgres, Redis).
    - **PostgreSQL**: Migrated from SQLite for better performance and concurrency.
    - **Background Jobs**: Redis + RQ for asynchronous PDF processing.

### Changed
- Login profile for "Professor" in the authentication screen.
- New status "APCC" (Aprovado pelo Conselho de Classe) logic in backend and frontend.

### Changed
- Updated status calculation: "REP" (Reprovado) takes precedence over "REC" (Recuperação).
- "AR" status is now displayed as "Apr Rec" (Aprovado com Recuperação) in frontend.
- "APCC" (from ACC) status now takes precedence over "AR" in backend calculation.
- Grades below 50.0 are now highlighted in red in the class details view.
- Improved visual labels for "Reprovado" (Red) and "APCC" (Info Blue) in student details.

## [0.1.0] - initial release
- Initial project setup with Flask backend and React frontend.
