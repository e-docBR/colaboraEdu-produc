import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { RootState } from "../app/store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export interface ChatResponse {
  text: string;
  type: "text" | "table" | "chart";
  data?: any;
  chart_config?: any;
}


type DashboardKpis = {
  total_alunos: number;
  total_turmas: number;
  media_geral: number;
  alunos_em_risco: number;
};

export type PublicTenant = {
  id: number;
  name: string;
  slug: string;
};

type LoginRequest = {
  username: string;
  password: string;
  tenant_slug?: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    role?: string;
    is_admin?: boolean;
    aluno_id?: number | null;
    photo_url?: string;
    must_change_password?: boolean;
    tenant_id?: number | null;
    tenant_name?: string;
  };
};

export type UsuarioAccount = {
  id: number;
  username: string;
  role?: string;
  is_admin: boolean;
  aluno_id?: number | null;
  photo_url?: string;
  must_change_password: boolean;
  aluno?: {
    id: number;
    nome: string;
    matricula: string;
    turma: string;
    turno: string;
  } | null;
};

type ListUsuariosResponse = {
  items: UsuarioAccount[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
};

type ListUsuariosParams = {
  page?: number;
  per_page?: number;
  q?: string;
  role?: string;
};

type CreateUsuarioPayload = {
  username: string;
  password: string;
  role?: string;
  is_admin?: boolean;
  aluno_id?: number | null;
  must_change_password?: boolean;
};

type UpdateUsuarioPayload = {
  id: number;
  username?: string;
  password?: string;
  role?: string;
  is_admin?: boolean;
  aluno_id?: number | null;
  must_change_password?: boolean;
};

export type NotaResumo = {
  id: number;
  disciplina: string;
  trimestre1?: number | null;
  trimestre2?: number | null;
  trimestre3?: number | null;
  total?: number | null;
  faltas?: number | null;
  situacao?: string | null;
  aluno?: {
    id: number;
    nome: string;
    turma: string;
    turno: string;
    status?: string | null;
  } | null;
};

type ListNotasResponse = {
  items: NotaResumo[];
  total: number;
};

type ListNotasParams = {
  turma?: string;
  turno?: string;
  disciplina?: string;
};

type NotasFiltrosResponse = {
  disciplinas: string[];
};

export type AlunoSummary = {
  id: number;
  nome: string;
  matricula: string;
  turma: string;
  turno: string;
  media?: number | null;
  faltas?: number | null;
  status?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  naturalidade?: string | null;
  zona?: string | null;
  endereco?: string | null;
  filiacao?: string | null;
  telefones?: string | null;
  cpf?: string | null;
  nis?: string | null;
  inep?: string | null;
  situacao_anterior?: string | null;
  email?: string | null;
};


export type AlunoNota = {
  id: number;
  disciplina: string;
  trimestre1?: number | null;
  trimestre2?: number | null;
  trimestre3?: number | null;
  total?: number | null;
  faltas?: number | null;
  situacao?: string | null;
};

export type AlunoDetail = AlunoSummary & {
  notas: AlunoNota[];
};

type ListAlunosParams = {
  page?: number;
  per_page?: number;
  q?: string;
  turno?: string;
  turma?: string;
};

type ListAlunosResponse = {
  items: AlunoSummary[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
};

export type TurmaSummary = {
  turma: string;
  turno: string;
  total_alunos: number;
  media?: number | null;
  faltas_medias?: number | null;
  slug?: string;
};

type ListTurmasResponse = {
  items: TurmaSummary[];
  total: number;
};

type TurmaAlunosResponse = {
  turma: string;
  turno: string;
  total: number;
  alunos: Array<
    AlunoSummary & {
      situacao?: string | null;
      notas: Array<{
        disciplina: string;
        trimestre1?: number | null;
        trimestre2?: number | null;
        trimestre3?: number | null;
        total?: number | null;
        faltas?: number | null;
        situacao?: string | null;
      }>;
    }
  >;
};

type UploadBoletimPayload = {
  file: File;
  turno: string;
  turma: string;
};

type UploadBoletimResponse = {
  filename: string;
  status: string;
  job_id: string;
  turno: string;
  turma: string;
};

type RelatorioResponse = {
  relatorio: string;
  dados: Array<Record<string, unknown>>;
};

export type RelatorioQueryArgs = {
  slug: string;
  turno?: string;
  serie?: string;
  turma?: string;
  disciplina?: string;
};

export type GraficoResponse<T = Record<string, unknown>> = {
  slug: string;
  dados: T[];
};

export type GraficoQueryArgs = {
  slug: string;
  turno?: string;
  serie?: string;
  turma?: string;
  trimestre?: string;
  disciplina?: string;
};

const sanitizeParams = (params?: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== "")
  );

export const api = createApi({
  reducerPath: "boletinsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      const academicYearId = state.app.academicYearId;
      if (academicYearId) {
        headers.set("x-academic-year-id", academicYearId.toString());
      }

      const tenantId = state.app.tenantId;
      if (tenantId) {
        headers.set("X-Tenant-ID", tenantId.toString());
      }

      return headers;
    }
  }),
  tagTypes: ["Dashboard", "Alunos", "Notas", "Uploads", "Turmas", "Usuarios", "Comunicados", "Ocorrencias"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      })
    }),
    listPublicTenants: builder.query<PublicTenant[], void>({
      query: () => "/auth/tenants"
    }),
    getDashboardKpis: builder.query<DashboardKpis, void>({
      query: () => "/dashboard/kpis",
      providesTags: ["Dashboard"]
    }),
    getTeacherDashboard: builder.query<{ distribution: Record<string, number>; alerts: any[]; classes_count: number; total_students: number; global_average: number; }, { q?: string; turno?: string; turma?: string } | void>({
      query: (params) => ({
        url: "/dashboard/professor",
        params: sanitizeParams(params ?? undefined)
      }),
      providesTags: ["Dashboard"]
    }),
    getAluno: builder.query<AlunoDetail, number | string>({
      query: (alunoId) => ({
        url: `/alunos/${alunoId}`
      }),
      providesTags: (_result, _error, alunoId) => ["Alunos", { type: "Alunos", id: alunoId }]
    }),
    listAlunos: builder.query<ListAlunosResponse, ListAlunosParams | void>({
      query: (params) => ({
        url: "/alunos",
        params: sanitizeParams(params ?? undefined)
      }),
      providesTags: ["Alunos"]
    }),
    listTurmas: builder.query<ListTurmasResponse, void>({
      query: () => ({
        url: "/turmas"
      }),
      providesTags: ["Turmas"]
    }),
    getTurmaAlunos: builder.query<TurmaAlunosResponse, string>({
      query: (slug) => ({
        url: `/turmas/${slug}/alunos`
      }),
      providesTags: (result, _error, slug) => ["Turmas", { type: "Turmas", id: slug }]
    }),
    uploadBoletim: builder.mutation<UploadBoletimResponse, UploadBoletimPayload>({
      query: ({ file, turno, turma }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("turno", turno);
        formData.append("turma", turma);

        return {
          url: "/uploads/pdf",
          method: "POST",
          body: formData
        };
      },
      invalidatesTags: ["Uploads", "Turmas", "Alunos", "Dashboard", "Notas"]
    }),
    getRelatorio: builder.query<RelatorioResponse, RelatorioQueryArgs>({
      query: ({ slug, ...params }) => ({
        url: `/relatorios/${slug}`,
        params: sanitizeParams(params)
      })
    }),
    getGrafico: builder.query<GraficoResponse, GraficoQueryArgs>({
      query: ({ slug, ...params }) => ({
        url: `/graficos/${slug}`,
        params: sanitizeParams(params)
      })
    }),
    getJobStatus: builder.query<{ status: string; result?: any; error?: string }, string>({
      query: (jobId) => `/uploads/jobs/${jobId}`,
      keepUnusedDataFor: 0
    }),
    listNotas: builder.query<ListNotasResponse, ListNotasParams | void>({
      query: (params) => ({
        url: "/notas",
        params: sanitizeParams(params ?? undefined)
      }),
      providesTags: ["Notas"]
    }),
    updateNota: builder.mutation<NotaResumo, { id: number; trimestre1?: number | null; trimestre2?: number | null; trimestre3?: number | null; total?: number | null; faltas?: number | null; situacao?: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/notas/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (result, _error, { id }) => ["Notas", { type: "Alunos", id: result?.aluno?.id }]
    }),
    getNotasFiltros: builder.query<NotasFiltrosResponse, void>({
      query: () => "/notas/filtros",
      providesTags: ["Notas"]
    }),
    changePassword: builder.mutation<void, { current_password: string; new_password: string }>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body
      })
    }),
    uploadPhoto: builder.mutation<{ photo_url: string }, FormData>({
      query: (formData) => ({
        url: "/usuarios/me/photo",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Usuarios"]
    }),
    listUsuarios: builder.query<ListUsuariosResponse, ListUsuariosParams | void>({
      query: (params) => ({
        url: "/usuarios",
        params: sanitizeParams(params ?? undefined)
      }),
      providesTags: ["Usuarios"]
    }),
    createUsuario: builder.mutation<UsuarioAccount, CreateUsuarioPayload>({
      query: (body) => ({
        url: "/usuarios",
        method: "POST",
        body
      }),
      invalidatesTags: ["Usuarios"]
    }),
    updateUsuario: builder.mutation<UsuarioAccount, UpdateUsuarioPayload>({
      query: ({ id, ...body }) => ({
        url: `/usuarios/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (result, _error, { id }) => ["Usuarios", { type: "Usuarios", id }]
    }),
    deleteUsuario: builder.mutation<void, number>({
      query: (id) => ({
        url: `/usuarios/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Usuarios"]
    }),
    getMe: builder.query<UsuarioAccount, void>({
      query: () => "/usuarios/me",
      providesTags: ["Usuarios"]
    }),
    listComunicados: builder.query<{ id: number; titulo: string; conteudo: string; autor: string; data_envio: string; arquivado?: boolean; target_type?: string; target_value?: string; is_read?: boolean }[], void>({
      query: () => "/comunicados",
      providesTags: ["Comunicados"]
    }),
    markComunicadoRead: builder.mutation<void, number>({
      query: (id) => ({
        url: `/comunicados/${id}/read`,
        method: "POST"
      }),
      invalidatesTags: ["Comunicados"]
    }),
    createComunicado: builder.mutation<void, { titulo: string; conteudo: string; target_type: string; target_value?: string }>({
      query: (body) => ({
        url: "/comunicados",
        method: "POST",
        body
      }),
      invalidatesTags: ["Comunicados"]
    }),
    updateComunicado: builder.mutation<void, { id: number; titulo?: string; conteudo?: string; arquivado?: boolean }>({
      query: ({ id, ...body }) => ({
        url: `/comunicados/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Comunicados"]
    }),
    deleteComunicado: builder.mutation<void, number>({
      query: (id) => ({
        url: `/comunicados/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Comunicados"]
    }),
    listOcorrencias: builder.query<{ id: number; aluno_id: number; tipo: string; descricao: string; resolvida: boolean; data_registro: string; aluno_nome: string; autor_nome: string }[], string | void>({
      query: (aluno_id) => ({
        url: "/ocorrencias",
        params: aluno_id ? { aluno_id } : undefined
      }),
      providesTags: ["Ocorrencias"]
    }),
    createOcorrencia: builder.mutation<void, { aluno_id: number; tipo: string; descricao: string; data_registro?: string; resolvida?: boolean }>({
      query: (body) => ({
        url: "/ocorrencias",
        method: "POST",
        body
      }),
      invalidatesTags: ["Ocorrencias"]
    }),
    updateOcorrencia: builder.mutation<void, { id: number; tipo?: string; descricao?: string; resolvida?: boolean; data_registro?: string }>({
      query: ({ id, ...body }) => ({
        url: `/ocorrencias/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Ocorrencias"]
    }),
    deleteOcorrencia: builder.mutation<void, number>({
      query: (id) => ({
        url: `/ocorrencias/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Ocorrencias"]
    }),
    chat: builder.mutation<ChatResponse, { message: string }>({
      query: (body) => ({
        url: "/chat",
        method: "POST",
        body
      })
    }),

    listAuditLogs: builder.query<{ id: number; action: string; user_id: number; target_type: string; timestamp: string; details?: any }[], void>({
      query: () => "/audit-logs",
      keepUnusedDataFor: 0
    }),
    createAluno: builder.mutation<AlunoSummary, Partial<AlunoSummary>>({
      query: (body) => ({
        url: "/alunos",
        method: "POST",
        body
      }),
      invalidatesTags: ["Alunos", "Dashboard", "Turmas"]
    }),
    updateAluno: builder.mutation<AlunoSummary, { id: number } & Partial<AlunoSummary>>({
      query: ({ id, ...body }) => ({
        url: `/alunos/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (result, _error, { id }) => ["Alunos", { type: "Alunos", id }, "Dashboard", "Turmas"]
    }),
    deleteAluno: builder.mutation<void, number>({
      query: (id) => ({
        url: `/alunos/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Alunos", "Dashboard", "Turmas"]
    }),
    listAcademicYears: builder.query<{ id: number; label: string; is_current: boolean }[], void>({
      query: () => "/academic-years",
      providesTags: ["Dashboard"]
    }),

    // Super Admin Endpoints
    listTenants: builder.query<any[], void>({
      query: () => "/admin/tenants",
      providesTags: ["Usuarios"] // Or a new 'Admin' tag
    }),
    createTenant: builder.mutation<void, { name: string; slug: string; initial_year: string; domain?: string; admin_email?: string; admin_password?: string }>({
      query: (body) => ({
        url: "/admin/tenants",
        method: "POST",
        body
      }),
      invalidatesTags: ["Usuarios"]
    }),
    addAcademicYearToTenant: builder.mutation<void, { tenantId: number; label: string; set_current?: boolean }>({
      query: ({ tenantId, ...body }) => ({
        url: `/admin/tenants/${tenantId}/years`,
        method: "POST",
        body
      }),
      invalidatesTags: ["Usuarios", "Dashboard"]
    }),
    updateTenant: builder.mutation<void, { id: number; name?: string; is_active?: boolean; domain?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/tenants/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Usuarios"]
    }),
    deleteTenant: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/tenants/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Usuarios"]
    })
  })
});

export const {
  useLoginMutation,
  useListPublicTenantsQuery,
  useGetDashboardKpisQuery,
  useGetTeacherDashboardQuery,
  useGetAlunoQuery,
  useListAlunosQuery,
  useListTurmasQuery,
  useGetTurmaAlunosQuery,
  useUploadBoletimMutation,
  useGetRelatorioQuery,
  useGetGraficoQuery,
  useGetJobStatusQuery,
  useListNotasQuery,
  useUpdateNotaMutation,
  useGetNotasFiltrosQuery,
  useChangePasswordMutation,
  useUploadPhotoMutation,
  useListUsuariosQuery,
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
  useDeleteUsuarioMutation,
  useGetMeQuery,
  useListComunicadosQuery,
  useMarkComunicadoReadMutation,
  useCreateComunicadoMutation,
  useUpdateComunicadoMutation,
  useDeleteComunicadoMutation,
  useListOcorrenciasQuery,
  useCreateOcorrenciaMutation,
  useUpdateOcorrenciaMutation,
  useDeleteOcorrenciaMutation,
  useChatMutation,
  useListAuditLogsQuery,
  useCreateAlunoMutation,
  useUpdateAlunoMutation,
  useDeleteAlunoMutation,
  useListAcademicYearsQuery,
  useListTenantsQuery,
  useCreateTenantMutation,
  useAddAcademicYearToTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation
} = api;

