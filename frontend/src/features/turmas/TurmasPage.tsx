import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid2 as Grid,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Chip,
  InputAdornment,
  useTheme,
  Avatar
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import GroupIcon from "@mui/icons-material/Group";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightlightIcon from "@mui/icons-material/Nightlight";
import ClassIcon from "@mui/icons-material/Class";

import { useListTurmasQuery } from "../../lib/api";

const progressFromMedia = (media?: number | null) => {
  if (media === undefined || media === null) return 0;
  // Support both 0-20 and 0-100 scales
  const scale = media > 20 ? 100 : 20;
  return Math.min(100, Math.max(0, (media / scale) * 100));
};


const getPerformanceColor = (media: number, theme: any) => {
  const isLargeScale = media > 20;
  if (isLargeScale) {
    if (media < 50) return theme.palette.error.main;
    if (media < 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  }
  if (media < 12) return theme.palette.error.main;
  if (media < 15) return theme.palette.warning.main;
  return theme.palette.success.main;
};


export const TurmasPage = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";

  const setSearch = (value: string) => {
    if (value) {
      searchParams.set("q", value);
    } else {
      searchParams.delete("q");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const { data, isLoading, isError } = useListTurmasQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });
  const turmas = data?.items ?? [];
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return turmas;
    return turmas.filter((t) =>
      t.turma?.toLowerCase().includes(term) ||
      t.turno?.toLowerCase().includes(term)
    );
  }, [turmas, search]);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Box mb={3}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            letterSpacing: "-0.02em",
            color: "text.primary",
            mb: 0.5
          }}
        >
          Turmas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestão de turmas e desempenho por série
        </Typography>
      </Box>

      <TextField
        placeholder="Buscar turma..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
      />

      {isError && <Alert severity="error" sx={{ mb: 3 }}>Erro ao carregar turmas</Alert>}

      <Grid container spacing={2}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            </Grid>
          ))
        ) : filtered.length === 0 ? (
          <Grid size={12}>
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">Nenhuma turma encontrada</Typography>
            </Box>
          </Grid>
        ) : (
          filtered.map((turma) => {
            const mediaVal = turma.media ?? 0;
            const progress = progressFromMedia(mediaVal);
            const performanceColor = getPerformanceColor(mediaVal, theme);


            return (
              <Grid key={turma.slug || turma.turma} size={{ xs: 12, sm: 6, md: 4 }}>

                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 1
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/app/turmas/${turma.slug || turma.turma}`)}

                    sx={{ height: "100%" }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 48,
                            height: 48
                          }}
                        >
                          <ClassIcon />
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            fontSize="1.125rem"
                            noWrap
                            mb={0.25}
                          >
                            {turma.turma}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {turma.turno === "Matutino" ? (
                              <WbSunnyIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                            ) : (
                              <NightlightIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                            )}
                            <Typography
                              variant="caption"
                              fontSize="0.75rem"
                              color="text.secondary"
                            >
                              {turma.turno}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} mb={2}>
                        <Chip
                          icon={<GroupIcon sx={{ fontSize: "14px !important" }} />}
                          label={`${turma.total_alunos ?? 0} alunos`}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: "0.75rem"
                          }}
                        />
                        <Chip
                          label={`Média: ${mediaVal.toFixed(1)}`}

                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.75rem",
                            bgcolor: `${performanceColor}15`,
                            color: performanceColor,
                            fontWeight: 600
                          }}
                        />
                      </Stack>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontSize="0.75rem" color="text.secondary">
                            Desempenho
                          </Typography>
                          <Typography variant="caption" fontSize="0.75rem" fontWeight={600}>
                            {progress.toFixed(0)}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "action.hover",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: performanceColor,
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Box>
  );
};
