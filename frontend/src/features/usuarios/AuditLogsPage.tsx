import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    Grid2 as Grid,
    useTheme,
    Fade,
    IconButton,
    Tooltip
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LayersIcon from "@mui/icons-material/Layers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";
import { useListAuditLogsQuery } from "../../lib/api";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

export const AuditLogsPage = () => {
    const theme = useTheme();
    const { data: logs, isLoading, error } = useListAuditLogsQuery();

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={40} thickness={4} sx={{ color: "primary.main" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 1 }}>
                        RECAPITULANDO EVENTOS...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>
                    Erro ao sincronizar com a central de auditoria.
                </Alert>
            </Box>
        );
    }

    const getActionColor = (action: string) => {
        if (action.includes("DELETE")) return "error";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "warning";
        if (action.includes("CREATE") || action.includes("POST")) return "success";
        return "info";
    };

    return (
        <Box p={{ xs: 2, md: 4 }}>
            {/* Header */}
            <Box mb={5}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Box sx={{ p: 1, bgcolor: "primary.main", color: "white", borderRadius: 1 }}>
                        <HistoryIcon />
                    </Box>
                    <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: "-0.03em" }}>
                        Auditoria de Sistema
                    </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                    Rastreabilidade completa de todas as alterações críticas e ações administrativas.
                </Typography>
            </Box>

            {/* Stats Summary */}
            <Grid container spacing={3} mb={5}>
                {[
                    { label: "Eventos Recentes", value: logs?.length || 0, icon: <LayersIcon />, color: "primary" },
                    { label: "Ações Críticas", value: logs?.filter(l => l.action.includes("DELETE")).length || 0, icon: <VisibilityIcon />, color: "error" },
                ].map((stat, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                            {stat.label.toUpperCase()}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={800} color={`${stat.color}.main`}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.light`, color: `${stat.color}.main`, opacity: 0.8 }}>
                                        {stat.icon}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Timeline List */}
            <Stack spacing={2}>
                {logs?.map((log, index) => (
                    <Fade in timeout={200 + index * 50} key={log.id}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                transition: "all 0.2s",
                                "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Grid container spacing={3} alignItems="center">
                                    {/* Action & Time */}
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <Stack spacing={0.5}>
                                            <Chip
                                                label={log.action}
                                                size="small"
                                                color={getActionColor(log.action)}
                                                sx={{ fontWeight: 800, fontSize: "0.65rem", height: 20 }}
                                            />
                                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                {dayjs(log.timestamp).fromNow().toUpperCase()}
                                            </Typography>
                                            <Typography variant="caption" fontSize="0.6rem" color="text.disabled">
                                                {dayjs(log.timestamp).format("DD/MM/YYYY HH:mm:ss")}
                                            </Typography>
                                        </Stack>
                                    </Grid>

                                    {/* Actor */}
                                    <Grid size={{ xs: 12, md: 2.5 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box sx={{ p: 1, bgcolor: "action.selected", borderRadius: "50%" }}>
                                                <PersonIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block' }}>
                                                    EXECUTADO POR
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {log.user_id ? `Usuário ID #${log.user_id}` : "Sistema Automático"}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>

                                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />

                                    {/* Target */}
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block' }}>
                                                ENTIDADE ALVO
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                {log.target_type}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Details */}
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <Box sx={{
                                            p: 2,
                                            bgcolor: "background.default",
                                            borderRadius: 2,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            maxHeight: 120,
                                            overflow: 'auto'
                                        }}>
                                            <Typography variant="caption" component="pre" sx={{
                                                fontFamily: "'Fira Code', monospace",
                                                fontSize: "0.7rem",
                                                color: "text.primary"
                                            }}>
                                                {JSON.stringify(log.details, null, 2)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Fade>
                ))}

                {logs?.length === 0 && (
                    <Box textAlign="center" py={10} bgcolor="action.hover" borderRadius={4} border="1px dashed" borderColor="divider">
                        <HistoryIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">Nenhum rastro encontrado nas últimas 24h.</Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};
