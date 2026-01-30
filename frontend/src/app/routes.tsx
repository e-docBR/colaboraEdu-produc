import { createBrowserRouter, redirect } from "react-router-dom";

import { DashboardLayout } from "../layouts/DashboardLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AlunosPage } from "../features/alunos/AlunosPage";
import { AlunoDetailPage } from "../features/alunos/AlunoDetailPage";
import { TurmasPage } from "../features/turmas/TurmasPage";
import { TurmaDetailPage } from "../features/turmas/TurmaDetailPage";
import { NotasPage } from "../features/notas/NotasPage";
import { GraficosPage } from "../features/graficos/GraficosPage";
import { RelatoriosPage } from "../features/relatorios/RelatoriosPage";
import { RelatorioDetailPage } from "../features/relatorios/RelatorioDetailPage";
import { UploadsPage } from "../features/uploads/UploadsPage";
import { UsuariosPage } from "../features/usuarios/UsuariosPage";
import { LoginPage } from "../features/auth/LoginPage";
import { ChangePasswordPage } from "../features/auth/ChangePasswordPage";
import { store } from "./store";
import { MeuBoletimPage } from "../features/alunos/MeuBoletimPage";
import { LandingPage } from "../features/landing/LandingPage";
import { TeacherDashboard } from "../features/dashboard/TeacherDashboard";
import { ComunicadosPage } from "../features/comunicados/ComunicadosPage";
import { OcorrenciasPage } from "../features/ocorrencias/OcorrenciasPage";
import { AuditLogsPage } from "../features/usuarios/AuditLogsPage";
import { TenantsPage } from "../features/super-admin/TenantsPage";

const requireAuth = async () => {
  const state = store.getState();
  const isAuthenticated = Boolean(state.auth.accessToken);
  if (!isAuthenticated) {
    throw redirect("/login");
  }
  return null;
};

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/relatorios/:slug?",
    loader: ({ params }) => {
      if (params.slug) {
        throw redirect(`/app/relatorios/${params.slug}`);
      }
      throw redirect(`/app/relatorios`);
    }
  },
  {
    path: "/alunos/:alunoId?",
    loader: ({ params }) => {
      if (params.alunoId) {
        throw redirect(`/app/alunos/${params.alunoId}`);
      }
      throw redirect(`/app/alunos`);
    }
  },
  {
    path: "/turmas/:turmaId?",
    loader: ({ params }) => {
      if (params.turmaId) {
        throw redirect(`/app/turmas/${params.turmaId}`);
      }
      throw redirect(`/app/turmas`);
    }
  },
  {
    path: "/app",
    loader: requireAuth,
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "professor", element: <TeacherDashboard /> },
      { path: "alunos", element: <AlunosPage /> },
      { path: "alunos/:alunoId", element: <AlunoDetailPage /> },
      { path: "turmas", element: <TurmasPage /> },
      { path: "turmas/:turmaId", element: <TurmaDetailPage /> },
      { path: "notas", element: <NotasPage /> },
      { path: "graficos", element: <GraficosPage /> },
      { path: "relatorios", element: <RelatoriosPage /> },
      { path: "relatorios/:slug", element: <RelatorioDetailPage /> },
      { path: "uploads", element: <UploadsPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "audit-logs", element: <AuditLogsPage /> },
      { path: "comunicados", element: <ComunicadosPage /> },
      { path: "ocorrencias", element: <OcorrenciasPage /> },
      { path: "meu-boletim", element: <MeuBoletimPage /> },
      { path: "admin/escolas", element: <TenantsPage /> }
    ]
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/alterar-senha",
    element: <ChangePasswordPage />
  }
]);
