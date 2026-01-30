import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button
} from "@mui/material";
import { useState } from "react";
import GradeIcon from "@mui/icons-material/Grade";
import DownloadIcon from "@mui/icons-material/Download";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CircleIcon from "@mui/icons-material/Circle";

import { useAppSelector } from "../../app/hooks";
import { useGetAlunoQuery, useListComunicadosQuery, useListOcorrenciasQuery } from "../../lib/api";

const formatNota = (value?: number | null) => (typeof value === "number" ? value.toFixed(1) : "-");

const formatSituacao = (value?: string | null) => {
  if (!value) return { label: "-", color: "default" as const };
  const normalized = value.toUpperCase();
  if (normalized.startsWith("APR")) return { label: "Aprovado", color: "success" as const };
  if (normalized.startsWith("REC")) return { label: "Recuperação", color: "warning" as const };
  if (normalized.startsWith("REP")) return { label: "Reprovado", color: "error" as const };
  if (normalized.startsWith("APCC")) return { label: "APCC", color: "info" as const };
  return { label: value, color: "default" as const };
};

export const MeuBoletimPage = () => {
  const alunoId = useAppSelector((state) => state.auth.user?.aluno_id);
  const alunoKey = alunoId ? String(alunoId) : "";
  const [tab, setTab] = useState(0);

  const { data, isLoading, isError } = useGetAlunoQuery(alunoKey, {
    skip: !alunoId
  });

  const { data: ocorrencias } = useListOcorrenciasQuery(alunoKey, {
    skip: !alunoId
  });

  const { data: comunicados } = useListComunicadosQuery(undefined, {
    skip: !alunoId
  });

  const token = useAppSelector((state) => state.auth.accessToken);

  const handleDownloadPdf = async () => {
    if (!alunoId || !token) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";

    try {
      const response = await fetch(`${baseUrl}/alunos/${alunoId}/boletim/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Falha ao gerar PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Meu_Boletim_${data?.nome.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro no download", error);
    }
  };

  if (!alunoId) {
    return <Alert severity="warning">Seu perfil não está associado a um aluno.</Alert>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar seu boletim.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {data.nome}
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} divider={<Divider flexItem orientation="vertical" />}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Matrícula
              </Typography>
              <Typography fontWeight={600}>{data.matricula}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Turma / Turno
              </Typography>
              <Typography fontWeight={600}>
                {data.turma} • {data.turno}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Média geral
              </Typography>
              <Typography fontWeight={600} color={data.media && data.media < 14 ? "error.main" : "success.main"}>
                {typeof data.media === "number" ? data.media.toFixed(1) : "-"}
              </Typography>
            </Box>
          </Stack>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPdf}
            >
              Baixar Meu Boletim (PDF)
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="boletim tabs">
          <Tab label="Boletim" icon={<GradeIcon />} iconPosition="start" />
          <Tab label="Minhas Ocorrências" icon={<WarningAmberIcon />} iconPosition="start" />
          <Tab label="Meus Recados" icon={<NotificationsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                <TableCell>1º Tri</TableCell>
                <TableCell>2º Tri</TableCell>
                <TableCell>3º Tri</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Faltas</TableCell>
                <TableCell>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.notas.map((nota) => {
                const situacao = formatSituacao(nota.situacao);
                return (
                  <TableRow key={nota.id} hover>
                    <TableCell>{nota.disciplina}</TableCell>
                    <TableCell>{formatNota(nota.trimestre1)}</TableCell>
                    <TableCell>{formatNota(nota.trimestre2)}</TableCell>
                    <TableCell>{formatNota(nota.trimestre3)}</TableCell>
                    <TableCell>{formatNota(nota.total)}</TableCell>
                    <TableCell>{nota.faltas ?? "-"}</TableCell>
                    <TableCell>
                      <Chip label={situacao.label} color={situacao.color} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            {!ocorrencias || ocorrencias.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                Nenhuma ocorrência registrada.
              </Typography>
            ) : (
              <List>
                {ocorrencias.map((oc, idx) => (
                  <Box key={oc.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <WarningAmberIcon color={oc.tipo === 'ELOGIO' ? 'success' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography fontWeight={600} component="div">
                            {oc.tipo}
                            <Typography component="span" variant="caption" color="text.secondary" ml={2}>
                              {new Date(oc.data_ocorrencia).toLocaleDateString()}
                            </Typography>
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary" display="block">
                              {oc.descricao}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              Registrado por: {oc.autor_nome}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {idx < ocorrencias.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          {!comunicados || comunicados.length === 0 ? (
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" align="center" py={4}>
                  Nenhum recado encontrado.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            comunicados.map((recado) => (
              <Card key={recado.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <NotificationsIcon color="primary" fontSize="small" />
                    <Typography fontWeight={600} variant="subtitle1">
                      {recado.titulo}
                    </Typography>
                    <Chip label={new Date(recado.data_envio).toLocaleDateString()} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {recado.conteudo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enviado por: {recado.autor}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}
    </Stack>
  );
};
