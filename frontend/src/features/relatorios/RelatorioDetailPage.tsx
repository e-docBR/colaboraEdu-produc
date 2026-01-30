import { ChangeEvent, useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useGetNotasFiltrosQuery, useGetRelatorioQuery, useListTurmasQuery } from "../../lib/api";
import { RELATORIOS_BY_SLUG, type RelatorioSlug } from "./config";
import { useDerivedRelatorio } from "./selectors";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

const DEFAULT_FILTERS = { turno: "", serie: "", turma: "", disciplina: "" };

const deriveSerieFromTurma = (turma?: string) => {
  if (!turma) return "";
  const parts = turma.trim().split(/\s+/);
  if (parts.length <= 1) return turma.trim();
  return parts.slice(0, -1).join(" ");
};

export const RelatorioDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: RelatorioSlug }>();
  const definition = slug ? RELATORIOS_BY_SLUG[slug] : undefined;
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const enableAdvancedFilters = definition?.slug === "melhores-alunos";
  const shouldFetchFilters = Boolean(enableAdvancedFilters);
  const { data: turmasData } = useListTurmasQuery(undefined, {
    skip: !shouldFetchFilters
  });
  const { data: notasFiltrosData } = useGetNotasFiltrosQuery(undefined, {
    skip: !shouldFetchFilters
  });

  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [slug]);

  const turmasList = useMemo(() => turmasData?.items ?? [], [turmasData]);

  const turnoOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const set = new Set<string>();
    turmasList.forEach((item) => {
      if (item.turno) {
        set.add(item.turno);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, turmasList]);

  const serieOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const set = new Set<string>();
    turmasList.forEach((item) => {
      const serie = deriveSerieFromTurma(item.turma);
      if (serie) {
        set.add(serie);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, turmasList]);

  const turmaOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const filtered = turmasList.filter((item) => {
      const matchesTurno = !filters.turno || item.turno === filters.turno;
      const matchesSerie = !filters.serie || deriveSerieFromTurma(item.turma) === filters.serie;
      return matchesTurno && matchesSerie;
    });
    const set = new Set(filtered.map((item) => item.turma));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, filters.serie, filters.turno, turmasList]);

  useEffect(() => {
    if (!enableAdvancedFilters || !filters.turma) return;
    if (!turmaOptions.includes(filters.turma)) {
      setFilters((prev) => ({ ...prev, turma: "" }));
    }
  }, [enableAdvancedFilters, filters.turma, turmaOptions]);

  const disciplinaOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const disciplinas = notasFiltrosData?.disciplinas ?? [];
    return [...disciplinas].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, notasFiltrosData]);

  const sanitizedFilters = useMemo(
    () => ({
      turno: filters.turno || undefined,
      serie: filters.serie || undefined,
      turma: filters.turma || undefined,
      disciplina: filters.disciplina || undefined
    }),
    [filters]
  );

  const queryArgs = slug
    ? {
      slug,
      ...sanitizedFilters
    }
    : undefined;

  const derivedResult = useDerivedRelatorio(slug, sanitizedFilters);
  const standardResult = useGetRelatorioQuery(queryArgs ?? { slug: "" }, {
    skip: !slug || !definition || !queryArgs || !!derivedResult
  });

  const { data, isLoading, isError, isFetching } = derivedResult || standardResult;

  const rows = Array.isArray(data?.dados) ? data!.dados : [];
  const hasRows = rows.length > 0;

  const combinationIssues = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const issues: string[] = [];
    if (filters.turma) {
      if (filters.serie && !filters.turma.toUpperCase().startsWith(filters.serie.toUpperCase())) {
        issues.push("A turma selecionada não pertence à série escolhida.");
      }
      const matchingTurmas = turmasList.filter((item) => item.turma === filters.turma);
      if (filters.turno && matchingTurmas.length && !matchingTurmas.some((item) => item.turno === filters.turno)) {
        issues.push("A turma selecionada não está disponível no turno informado.");
      }
    }
    return issues;
  }, [enableAdvancedFilters, filters.serie, filters.turma, filters.turno, turmasList]);

  if (!definition) {
    return <Alert severity="warning">Relatório não encontrado.</Alert>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar os dados deste relatório.</Alert>;
  }

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => {
      let next = {
        ...prev,
        [field]: value,
        ...(field === "serie" ? { turma: "" } : {})
      };
      if (field === "turma") {
        if (!value) {
          next = { ...next, turma: "" };
        } else {
          const derivedSerie = deriveSerieFromTurma(value);
          const match = turmasList.find((item) => item.turma === value);
          next = {
            ...next,
            turma: value,
            serie: derivedSerie || next.serie,
            turno: match?.turno ?? next.turno
          };
        }
      }
      return next;
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Breadcrumbs>
          <Link component={RouterLink} to="/app/relatorios" underline="hover">
            Relatórios
          </Link>
          <Typography color="text.primary">{definition.title}</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={600}>
            {definition.title}
          </Typography>
          <Typography color="text.secondary">{definition.description}</Typography>
        </CardContent>
      </Card>

      {enableAdvancedFilters && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
              <TextField
                select
                label="Turno"
                value={filters.turno}
                onChange={handleFilterChange("turno")}
                fullWidth
              >
                <MenuItem value="">Todos os turnos</MenuItem>
                {turnoOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Série"
                value={filters.serie}
                onChange={handleFilterChange("serie")}
                fullWidth
              >
                <MenuItem value="">Todas as séries</MenuItem>
                {serieOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Turma"
                value={filters.turma}
                onChange={handleFilterChange("turma")}
                disabled={turmaOptions.length === 0}
                fullWidth
              >
                <MenuItem value="">Todas as turmas</MenuItem>
                {turmaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Disciplina"
                value={filters.disciplina}
                onChange={handleFilterChange("disciplina")}
                disabled={disciplinaOptions.length === 0}
                fullWidth
              >
                <MenuItem value="">Todas as disciplinas</MenuItem>
                {disciplinaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {combinationIssues.length > 0 && (
              <Box mt={2}>
                <Alert severity="warning" sx={{ mb: 0 }}>
                  {combinationIssues[0]}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ minHeight: 400 }}>
          {!definition.type || definition.type === "table" ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {definition.columns.map((column) => (
                      <TableCell key={column.key} align={column.align}>
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!hasRows && !isFetching ? (
                    <TableRow>
                      <TableCell colSpan={definition.columns.length} align="center">
                        <Typography color="text.secondary">Nenhum dado disponível.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={`${definition.slug}-${index}`} hover>
                        {definition.columns.map((column) => (
                          <TableCell key={column.key} align={column.align}>
                            {column.render(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                  {isFetching && (
                    <TableRow>
                      <TableCell colSpan={definition.columns.length} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : definition.type === "heatmap" ? (
            <HeatmapVisual data={rows} />
          ) : definition.type === "scatter" ? (
            <ScatterVisual data={rows} />
          ) : definition.type === "radar" ? (
            <RadarVisual data={rows} />
          ) : definition.type === "bar" ? (
            <BarVisual data={rows} />
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
};

// --- Visualization Components ---


const HeatmapVisual = ({ data }: { data: any[] }) => {
  // Map strings to numbers for axis
  const turmas = Array.from(new Set(data.map(d => d.turma))).sort();
  const disciplinas = Array.from(new Set(data.map(d => d.disciplina))).sort();

  const chartData = data.map(d => ({
    ...d,
    x: turmas.indexOf(d.turma),
    y: disciplinas.indexOf(d.disciplina),
    z: d.media
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <Card sx={{ p: 1, boxShadow: 3 }}>
          <Typography variant="subtitle2">{d.turma} - {d.disciplina}</Typography>
          <Typography variant="body2">Média: {d.media}</Typography>
        </Card>
      );
    }
    return null;
  };

  // Custom Shape for colored squares
  const renderShape = (props: any) => {
    const { cx, cy, payload } = props;
    const size = 30;
    // Color scale: Red < 60, Yellow < 80, Green >= 80
    let fill = "#81c784";
    if (payload.media < 60) fill = "#e57373";
    else if (payload.media < 80) fill = "#fff176";

    return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={fill} stroke="#ccc" />;
  };

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
        <XAxis type="number" dataKey="x" name="turma" tickFormatter={i => turmas[i]} domain={[0, turmas.length - 1]} tickCount={turmas.length} />
        <YAxis type="number" dataKey="y" name="disciplina" tickFormatter={i => disciplinas[i]} domain={[0, disciplinas.length - 1]} tickCount={disciplinas.length} width={100} />
        <ZAxis type="number" dataKey="z" range={[0, 100]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={chartData} shape={renderShape} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

const ScatterVisual = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
      // Check data keys
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" dataKey="frequencia" name="Frequência" unit="%" domain={[0, 100]} />
      <YAxis type="number" dataKey="media" name="Média" unit="" domain={[0, 100]} />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Legend />
      <Scatter name="Alunos" data={data} fill="#8884d8" />
    </ScatterChart>
  </ResponsiveContainer>
);

const RadarVisual = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar name="Média Geral" dataKey="Média Geral" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Radar name="Assiduidade" dataKey="Assiduidade" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const BarVisual = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="turma" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Bar dataKey="media" name="Média da Turma" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      <Bar dataKey="escola" name="Média da Escola" fill="#94a3b8" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
