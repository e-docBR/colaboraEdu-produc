import { alpha } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsightsIcon from "@mui/icons-material/Insights";
import SecurityIcon from "@mui/icons-material/Security";
import TimelineIcon from "@mui/icons-material/Timeline";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolIcon from "@mui/icons-material/School";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../app/hooks";

const brandPalette = {
  blue: "#0066ff",
  green: "#18b26b",
  amber: "#f5a524"
};

const stats = [
  {
    label: "Alunos monitorados",
    value: "3.240",
    detail: "Atualização automática por PDF"
  },
  {
    label: "Alertas inteligentes",
    value: "+480",
    detail: "Riscos identificados por turno"
  },
  {
    label: "Tempo salvo",
    value: "72h/sem",
    detail: "Processos manuais eliminados"
  },
  {
    label: "Relatórios gerados",
    value: "+1.800",
    detail: "Exportações em CSV / PDF"
  }
];

const workflows = [
  {
    title: "Importação guiada",
    description: "Arraste os boletins em PDF e deixe o motor de ingestão normalizar turmas, turnos e trimestres automaticamente.",
    icon: <TimelineIcon />
  },
  {
    title: "Diagnósticos instantâneos",
    description: "KPIs e gráficos cruzam notas, faltas e situação final para evidenciar alunos em risco em segundos.",
    icon: <InsightsIcon />
  },
  {
    title: "Plano de ação colaborativo",
    description: "Coordenação, orientação e direção acessam o mesmo painel e registram decisões diretamente nos relatórios.",
    icon: <GroupsIcon />
  }
];

const audiences = [
  {
    role: "Administração",
    summary: "Configura usuários, perfis e acompanha ingestões em tempo real.",
    focus: ["Controle total de permissões", "Histórico de importações", "Exportação completa"]
  },
  {
    role: "Coordenação",
    summary: "Prioriza turmas críticas, compara trimestres e agenda intervenções.",
    focus: ["Mapa de calor de notas", "Alertas por disciplina", "Lista de alunos em risco"]
  },
  {
    role: "Professores e orientação",
    summary: "Recebem insights prontos para orientar alunos e responsáveis.",
    focus: ["Métricas por turma", "Evolução individual", "Notas e faltas consolidadas"]
  }
];

const testimonials = [
  {
    name: "Silvana Castro",
    role: "Coordenadora Pedagógica",
    quote:
      "Antes levávamos dias para consolidar notas. Agora, em 10 minutos sabemos quais turmas precisam de reforço e acionamos a equipe com dados.",
    color: brandPalette.blue
  },
  {
    name: "Rafael Lima",
    role: "Diretor Acadêmico",
    quote:
      "O painel trouxe transparência para toda a liderança. As reuniões agora começam com KPIs e terminam com planos práticos.",
    color: brandPalette.green
  }
];

const proofPoints = [
  { label: "Autenticação segura", icon: <SecurityIcon /> },
  { label: "Controle por perfis", icon: <VerifiedIcon /> },
  { label: "Integração com ingestão PDF", icon: <TrendingUpIcon /> }
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => Boolean(state.auth.accessToken));
  const primaryCtaLabel = isAuthenticated ? "Ir para o painel" : "Entrar como administrador";
  const primaryCtaTarget = isAuthenticated ? "/app" : "/login";
  const studentCtaTarget = "/login?perfil=aluno";

  const chips = useMemo(
    () => ["Secretaria", "Coordenação", "Orientação", "Direção"],
    []
  );

  const handlePrimaryCta = () => navigate(primaryCtaTarget);
  const handleStudentCta = () => navigate(studentCtaTarget);

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Box component="header" sx={{ py: 2, borderBottom: 1, borderColor: "divider", position: "sticky", top: 0, bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", zIndex: 10 }}>
        <Container sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box component="img" src="/colaboraedu4.png" alt="Colabora EDU" sx={{ height: 42 }} />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
              Inteligência acadêmica para decisões rápidas
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              onClick={handlePrimaryCta}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 999, px: 3 }}
            >
              {primaryCtaLabel}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleStudentCta}
              sx={{ borderRadius: 999, px: 2.5 }}
            >
              Acesso aluno/responsável
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box component="section" sx={{ position: "relative", overflow: "hidden", py: { xs: 8, md: 12 }, background: `radial-gradient(circle at 10% 20%, ${alpha(brandPalette.green, 0.15)}, transparent 45%), radial-gradient(circle at 90% 10%, ${alpha(brandPalette.amber, 0.2)}, transparent 50%), linear-gradient(135deg, #040b1c, #071838)` }}>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Plataforma colaboraEDU" color="primary" sx={{ mb: 3, fontWeight: 600 }} />
              <Typography variant="h2" color="white" fontWeight={600} gutterBottom>
                Inteligência em boletins para lideranças educacionais.
              </Typography>
              <Typography variant="h6" color={alpha("#ffffff", 0.8)} maxWidth={520} mb={4}>
                Reúna ingestão automatizada, dashboards executivos e trilhas de ação em um único cockpit, pronto para decisões de secretaria, coordenação e direção.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
                <Button size="large" variant="contained" color="secondary" onClick={handlePrimaryCta} sx={{ borderRadius: 999 }}>
                  {primaryCtaLabel}
                </Button>
                <Button size="large" variant="outlined" color="inherit" onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })} sx={{ color: "white", borderColor: alpha("#ffffff", 0.4), borderRadius: 999 }}>
                  Ver como funciona
                </Button>
                <Button size="large" variant="outlined" color="secondary" onClick={handleStudentCta} sx={{ borderRadius: 999, bgcolor: alpha("#ffffff", 0.08), color: "white", borderColor: alpha("#ffffff", 0.4) }}>
                  Portal aluno/responsável
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {chips.map((label) => (
                  <Chip key={label} label={label} icon={<CheckCircleIcon />} sx={{ bgcolor: alpha("#ffffff", 0.1), color: "white" }} />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, background: alpha("#ffffff", 0.08), borderRadius: 4, border: "1px solid", borderColor: alpha("#ffffff", 0.2) }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar src="/colaboraedu3.png" alt="Marca Colabora" sx={{ width: 64, height: 64 }} />
                    <Box>
                      <Typography color="white" fontWeight={600}>
                        Painel Consolidado 360º
                      </Typography>
                      <Typography color={alpha("#ffffff", 0.7)} variant="body2">
                        Matutino - Vespertino - Noturno
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ borderColor: alpha("#ffffff", 0.2) }} />
                  <Stack spacing={1}>
                    {proofPoints.map((item) => (
                      <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha("#ffffff", 0.12), color: "white" }}>{item.icon}</Avatar>
                        <Typography color="white">{item.label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: alpha("#000", 0.05) }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={600} color="text.primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {stat.detail}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="section" id="workflow" sx={{ py: { xs: 6, md: 8 }, backgroundColor: alpha(brandPalette.blue, 0.04) }}>
        <Container>
          <Stack spacing={2} mb={4}>
            <Typography variant="overline" color="primary" fontWeight={600}>
              Fluxo integrado
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              Do PDF bruto à decisão estratégica.
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={720}>
              Automatize ingestões, visualize tendências por turno e direcione ações específicas para cada ciclo acadêmico.
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {workflows.map((step, index) => (
              <Grid item xs={12} md={4} key={step.title}>
                <Card sx={{ height: "100%", borderRadius: 4, borderTop: `4px solid ${[brandPalette.blue, brandPalette.green, brandPalette.amber][index]}` }}>
                  <CardContent>
                    <Avatar sx={{ bgcolor: alpha([brandPalette.blue, brandPalette.green, brandPalette.amber][index], 0.1), color: [brandPalette.blue, brandPalette.green, brandPalette.amber][index], mb: 2 }}>
                      {step.icon as ReactElement}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={3}>
          {audiences.map((audience) => (
            <Grid item xs={12} md={4} key={audience.role}>
              <Card sx={{ height: "100%", borderRadius: 4, p: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
                    {audience.role}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {audience.summary}
                  </Typography>
                  <Stack spacing={1} mt={2}>
                    {audience.focus.map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="section" sx={{ py: { xs: 6, md: 8 }, background: `linear-gradient(120deg, ${brandPalette.blue}, ${brandPalette.green})` }}>
        <Container>
          <Grid container spacing={3}>
            {testimonials.map((testimonial) => (
              <Grid item xs={12} md={6} key={testimonial.name}>
                <Card sx={{ height: "100%", borderRadius: 4, background: alpha("#ffffff", 0.1), color: "white", border: "1px solid", borderColor: alpha("#ffffff", 0.2) }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ fontStyle: "italic" }} gutterBottom>
                      "{testimonial.quote}"
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                      <Avatar sx={{ bgcolor: alpha("#000", 0.2) }}>{testimonial.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography fontWeight={600}>{testimonial.name}</Typography>
                        <Typography variant="body2" color={alpha("#ffffff", 0.8)}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Card sx={{ borderRadius: 5, p: { xs: 4, md: 6 }, background: `linear-gradient(135deg, ${brandPalette.blue}, ${brandPalette.amber})`, color: "white" }}>
          <Stack spacing={3}>
            <Typography variant="overline" fontWeight={600} color={alpha("#ffffff", 0.8)}>
              Acessos rápidos
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%", borderRadius: 4, p: 3, background: alpha("#000000", 0.2), border: "1px solid", borderColor: alpha("#ffffff", 0.2) }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: alpha("#ffffff", 0.2) }}>
                      <SecurityIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color={alpha("#ffffff", 0.9)} fontWeight={600}>
                        Portal Administrativo
                      </Typography>
                      <Typography variant="caption" color={alpha("#ffffff", 0.75)}>
                        Gestores, secretaria e coordenação
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={1.2} mb={2}>
                    {["Importações e usuários", "KPIs por turno e série", "Relatórios consolidados"].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Typography variant="body2" color={alpha("#ffffff", 0.85)}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ borderRadius: 3, bgcolor: alpha("#ffffff", 0.2), color: "white" }}
                    onClick={handlePrimaryCta}
                    endIcon={<ArrowForwardIcon />}
                  >
                    {primaryCtaLabel}
                  </Button>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%", borderRadius: 4, p: 3, background: alpha("#ffffff", 0.15), border: "1px solid", borderColor: alpha("#ffffff", 0.25) }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: alpha("#000000", 0.15), color: "white" }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color={alpha("#000000", 0.9)} fontWeight={700}>
                        Portal Aluno/Responsável
                      </Typography>
                      <Typography variant="caption" color={alpha("#000000", 0.7)}>
                        Acompanhe notas, faltas e mensagens
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={1.2} mb={2}>
                    {["Visualização de boletins", "Linha do tempo de notificações", "Orientações personalizadas"].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <FamilyRestroomIcon fontSize="small" />
                        <Typography variant="body2" color={alpha("#000000", 0.75)}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ borderRadius: 3, borderColor: alpha("#000000", 0.5), color: "black", bgcolor: alpha("#ffffff", 0.7) }}
                    onClick={handleStudentCta}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Acessar como aluno/responsável
                  </Button>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Card>
      </Container>

      <Box component="footer" sx={{ py: 4, borderTop: 1, borderColor: "divider" }}>
        <Container sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box component="img" src="/colaboraedu3.png" alt="Colabora EDU" sx={{ height: 40 }} />
            <Typography variant="body2" color="text.secondary">
              Copyright {new Date().getFullYear()} Colabora EDU - Dados estratégicos para escolas.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Segurança avançada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Suporte dedicado
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
