import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid2 as Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Autocomplete,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem as MuiMenuItem,
    ListItemIcon,
    Tooltip,
    Avatar,
    useTheme,
    Fade,
    Pagination
} from "@mui/material";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarIcon from "@mui/icons-material/Star";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BlockIcon from "@mui/icons-material/Block";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import {
    useCreateOcorrenciaMutation,
    useListOcorrenciasQuery,
    useListAlunosQuery,
    useUpdateOcorrenciaMutation,
    useDeleteOcorrenciaMutation
} from "../../lib/api";
import { useAppSelector } from "../../app/hooks";

const TIPO_CONFIG: Record<string, { color: string, label: string, icon: React.ElementType, bgcolor: string }> = {
    ADVERTENCIA: { color: "#f59e0b", label: "Advertência", icon: WarningAmberIcon, bgcolor: "#fef3c7" },
    ELOGIO: { color: "#10b981", label: "Elogio", icon: StarIcon, bgcolor: "#d1fae5" },
    ATRASO: { color: "#3b82f6", label: "Atraso", icon: ScheduleIcon, bgcolor: "#dbeafe" },
    SUSPENSAO: { color: "#ef4444", label: "Suspensão", icon: BlockIcon, bgcolor: "#fee2e2" },
    OUTRO: { color: "#6b7280", label: "Outro", icon: InfoIcon, bgcolor: "#f3f4f6" }
};

export const OcorrenciasPage = () => {
    const theme = useTheme();
    const { data: ocorrencias, isLoading } = useListOcorrenciasQuery();
    const { data: alunosData } = useListAlunosQuery({ per_page: 1000 });
    const [createOcorrencia, { isLoading: isCreating }] = useCreateOcorrenciaMutation();
    const [updateOcorrencia] = useUpdateOcorrenciaMutation();
    const [deleteOcorrencia] = useDeleteOcorrenciaMutation();

    const user = useAppSelector((state) => state.auth.user);
    const isStaff = user?.role !== "aluno";

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [alunoId, setAlunoId] = useState<number | null>(null);
    const [tipo, setTipo] = useState("ADVERTENCIA");
    const [descricao, setDescricao] = useState("");

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOcorrencia, setMenuOcorrencia] = useState<any | null>(null);

    const [searchTerm, setSearchTerm] = useState("");

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, ocorrencia: any) => {
        setAnchorEl(event.currentTarget);
        setMenuOcorrencia(ocorrencia);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuOcorrencia(null);
    };

    const filteredOcorrencias = ocorrencias?.filter((oc) => {
        if (!searchTerm) return true;
        const lowTerm = searchTerm.toLowerCase();
        return (
            oc.aluno_nome?.toLowerCase().includes(lowTerm) ||
            oc.descricao?.toLowerCase().includes(lowTerm) ||
            oc.tipo?.toLowerCase().includes(lowTerm)
        );
    }) || [];

    const handleSave = async () => {
        if (!alunoId) return;
        try {
            if (editingId) {
                await updateOcorrencia({
                    id: editingId,
                    tipo,
                    descricao
                }).unwrap();
            } else {
                await createOcorrencia({
                    aluno_id: alunoId,
                    tipo,
                    descricao,
                    data_ocorrencia: new Date().toISOString()
                }).unwrap();
            }
            setOpen(false);
            resetForm();
        } catch {
            alert("Erro ao salvar ocorrência");
        }
    };

    const resetForm = () => {
        setDescricao("");
        setAlunoId(null);
        setEditingId(null);
        setTipo("ADVERTENCIA");
    };

    const handleEdit = () => {
        if (!menuOcorrencia) return;
        setEditingId(menuOcorrencia.id);
        setAlunoId(menuOcorrencia.aluno_id);
        setTipo(menuOcorrencia.tipo);
        setDescricao(menuOcorrencia.descricao);
        setOpen(true);
        handleCloseMenu();
    };

    const handleDelete = async () => {
        if (!menuOcorrencia) return;
        if (confirm("Tem certeza que deseja excluir esta ocorrência?")) {
            await deleteOcorrencia(menuOcorrencia.id);
        }
        handleCloseMenu();
    };

    const handleToggleResolve = async () => {
        if (!menuOcorrencia) return;
        await updateOcorrencia({
            id: menuOcorrencia.id,
            resolvida: !menuOcorrencia.resolvida
        });
        handleCloseMenu();
    };

    if (!isStaff && !isLoading && (!ocorrencias || ocorrencias.length === 0)) {
        return (
            <Box textAlign="center" py={10}>
                <Typography variant="h6" color="text.secondary">Nenhuma ocorrência registrada.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* Header - Compact */}
            <Box mb={3} display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "flex-end" }} gap={2}>
                <Box>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{
                            letterSpacing: "-0.02em",
                            color: "text.primary",
                            mb: 0.5
                        }}
                    >
                        Ocorrências
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Registro e acompanhamento disciplinar dos alunos
                    </Typography>
                </Box>
                {isStaff && (
                    <Button
                        variant="contained"
                        onClick={() => setOpen(true)}
                        startIcon={<AddIcon />}
                        sx={{
                            px: 2.5,
                            py: 1,
                            fontWeight: 600,
                            textTransform: "none",
                            bgcolor: "error.main",
                            "&:hover": { bgcolor: "error.dark" }
                        }}
                    >
                        Nova Ocorrência
                    </Button>
                )}
            </Box>

            <Box mb={3}>
                <TextField
                    placeholder="Buscar por aluno, tipo ou descrição..."
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {isLoading ? (
                <Grid container spacing={3}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Grid key={index} size={{ xs: 12, md: 6, lg: 4 }}>
                            <Box sx={{ height: 200, bgcolor: "background.paper", borderRadius: 4, p: 3 }}>
                                <Fade in={true}><CircularProgress /></Fade>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            ) : filteredOcorrencias.length > 0 ? (
                <Grid container spacing={2}>
                    {filteredOcorrencias.map((oc) => {
                        const config = TIPO_CONFIG[oc.tipo] || TIPO_CONFIG["OUTRO"];
                        const Icon = config.icon;

                        return (
                            <Grid key={oc.id} size={{ xs: 12, md: 6, lg: 4 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: oc.resolvida ? "success.light" : "divider",
                                        bgcolor: "background.paper",
                                        position: "relative",
                                        overflow: "visible",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: theme.shadows[2],
                                            borderColor: config.color
                                        }
                                    }}
                                >
                                    {/* Status Indicator Stripe */}
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 20,
                                            left: 0,
                                            width: 4,
                                            height: 40,
                                            borderTopRightRadius: 4,
                                            borderBottomRightRadius: 4,
                                            bgcolor: config.color
                                        }}
                                    />

                                    <Box p={2.5}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar sx={{ bgcolor: config.bgcolor, color: config.color }}>
                                                    <Icon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700} fontSize="1.125rem" lineHeight={1.2}>
                                                        {oc.aluno_nome}
                                                    </Typography>
                                                    <Typography variant="caption" fontSize="0.75rem" color="text.secondary">
                                                        Registrado por {oc.autor_nome}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {isStaff && (
                                                <IconButton onClick={(e) => handleOpenMenu(e, oc)} size="small">
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Stack>

                                        <Chip
                                            label={config.label}
                                            size="small"
                                            sx={{
                                                bgcolor: config.bgcolor,
                                                color: config.color,
                                                fontWeight: 600,
                                                fontSize: "0.625rem",
                                                height: 20,
                                                mb: 2
                                            }}
                                        />

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: "text.primary",
                                                mb: 3,
                                                minHeight: 48,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textDecoration: oc.resolvida ? "line-through" : "none",
                                                opacity: oc.resolvida ? 0.6 : 1
                                            }}
                                        >
                                            {oc.descricao}
                                        </Typography>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center" pt={2} borderTop="1px solid" borderColor="divider">
                                            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                                                <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption" fontWeight={500}>
                                                    {new Date(oc.data_ocorrencia).toLocaleDateString()}
                                                </Typography>
                                            </Stack>

                                            {oc.resolvida ? (
                                                <Chip
                                                    icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                                                    label="Resolvido"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600 }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="warning.main" fontWeight={700}>
                                                    Pendente
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box textAlign="center" py={10} bgcolor="background.paper" borderRadius={4} border="1px dashed" borderColor="divider">
                    <SearchIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.primary" gutterBottom>Nenhum registro encontrado</Typography>
                </Box>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 3, minWidth: 150 }
                }}
            >
                <MuiMenuItem onClick={handleEdit}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Editar
                </MuiMenuItem>
                <MuiMenuItem onClick={handleToggleResolve}>
                    <ListItemIcon><CheckCircleIcon fontSize="small" color={menuOcorrencia?.resolvida ? "disabled" : "success"} /></ListItemIcon>
                    {menuOcorrencia?.resolvida ? "Reabrir" : "Marcar como Resolvido"}
                </MuiMenuItem>
                <Divider />
                <MuiMenuItem onClick={handleDelete}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <Typography color="error" variant="body2" fontWeight={600}>Excluir</Typography>
                </MuiMenuItem>
            </Menu>

            <Dialog
                open={open}
                onClose={() => { setOpen(false); resetForm(); }}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingId ? "Editar Ocorrência" : "Nova Ocorrência"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Autocomplete
                            options={alunosData?.items || []}
                            getOptionLabel={(option) => `${option.nome} (${option.turma})`}
                            onChange={(_, value) => setAlunoId(value?.id || null)}
                            value={alunosData?.items?.find((a) => a.id === alunoId) || null}
                            renderInput={(params) => <TextField {...params} label="Selecione o Aluno" variant="outlined" />}
                            disabled={!!editingId} // Disable student change on edit
                            ListboxProps={{ style: { maxHeight: 200 } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Ocorrência</InputLabel>
                            <Select
                                value={tipo}
                                label="Tipo de Ocorrência"
                                onChange={(e) => setTipo(e.target.value)}
                                renderValue={(selected) => {
                                    const config = TIPO_CONFIG[selected];
                                    const Icon = config?.icon;
                                    return (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {Icon && <Icon fontSize="small" sx={{ color: config.color }} />}
                                            {config?.label}
                                        </Box>
                                    );
                                }}
                            >
                                {Object.entries(TIPO_CONFIG).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        <ListItemIcon>
                                            <config.icon fontSize="small" sx={{ color: config.color }} />
                                        </ListItemIcon>
                                        <Typography variant="body2" fontWeight={500}>{config.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Descrição do Fato"
                            fullWidth
                            multiline
                            rows={4}
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o ocorrido detalhadamente..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => { setOpen(false); resetForm(); }} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="error" // Keep red for serious action
                        disabled={isCreating || !alunoId}
                        sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
                    >
                        {editingId ? "Salvar Alterações" : "Registrar Ocorrência"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
