import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";
import { MouseEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout, updateUser } from "../../features/auth/authSlice";
import { setAcademicYearId, setTenantId } from "../../features/app/appSlice";
import { useUploadPhotoMutation, useListAcademicYearsQuery, useListPublicTenantsQuery, useListComunicadosQuery, useMarkComunicadoReadMutation, api } from "../../lib/api";
import { ThemeToggle } from "./ThemeToggle";

const getInitials = (value?: string) =>
  value
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  super_admin: "Super Admin",
  coordenador: "Coordenador",
  professor: "Professor",
  aluno: "Aluno",
  diretor: "Diretor",
  orientador: "Orientador"
};

const AcademicYearSelector = () => {
  const { data: years, isLoading } = useListAcademicYearsQuery();
  const currentYearId = useAppSelector((state) => state.app.academicYearId);
  const dispatch = useAppDispatch();

  if (isLoading || !years || years.length === 0) return null;

  const selectedId = currentYearId || years.find((y: { is_current: boolean; id: number }) => y.is_current)?.id || years[0].id;

  return (
    <TextField
      select
      size="small"
      value={selectedId}
      onChange={(e) => {
        const newId = Number(e.target.value);
        dispatch(setAcademicYearId(newId));
        dispatch(api.util.invalidateTags(["Dashboard", "Alunos", "Notas", "Turmas", "Comunicados", "Ocorrencias", "Uploads"]));
      }}
      sx={{
        minWidth: 100,
        "& .MuiOutlinedInput-root": {
          fontSize: "0.875rem",
          fontWeight: 600
        }
      }}
      SelectProps={{ native: true }}
    >
      {years.map((year: { id: number; label: string; is_current: boolean }) => (
        <option key={year.id} value={year.id}>
          {year.label} {year.is_current ? "(Atual)" : ""}
        </option>
      ))}
    </TextField>
  );
};

const TenantSelector = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { data: tenants, isLoading } = useListPublicTenantsQuery();
  const currentTenantId = useAppSelector((state) => state.app.tenantId);
  const dispatch = useAppDispatch();

  if (user?.role !== "super_admin") return null;
  if (isLoading || !tenants || tenants.length === 0) return null;

  const selectedId = currentTenantId || tenants[0].id;

  return (
    <TextField
      select
      size="small"
      value={selectedId}
      onChange={(e) => {
        const newId = Number(e.target.value);
        dispatch(setTenantId(newId));
        dispatch(api.util.invalidateTags(["Dashboard", "Alunos", "Notas", "Turmas", "Comunicados", "Ocorrencias", "Uploads"]));
      }}
      sx={{
        minWidth: 150,
        "& .MuiOutlinedInput-root": {
          fontSize: "0.875rem",
          fontWeight: 600
        }
      }}
      SelectProps={{ native: true }}
    >
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </TextField>
  );
};

export const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get("q") || "";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isSearchPage = ["/app/alunos", "/app/turmas"].includes(location.pathname);

    if (isSearchPage) {
      if (value) {
        searchParams.set("q", value);
      } else {
        searchParams.delete("q");
      }
      setSearchParams(searchParams, { replace: true });
    } else if (value) {
      navigate(`/app/alunos?q=${encodeURIComponent(value)}`);
    }
  };

  const menuOpen = Boolean(anchorEl);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const { data: comunicados } = useListComunicadosQuery();
  const [markRead] = useMarkComunicadoReadMutation();

  const unreadCount = useMemo(() => {
    if (!comunicados) return 0;
    // For admins, show notifications if they are new (sent in last 24h) or just show all active ones
    // For students, show unread count
    if (user?.role === "aluno") {
      return comunicados.filter(c => !c.is_read).length;
    }
    // For staff, show count of non-archived ones
    return comunicados.filter(c => !c.arquivado).length;
  }, [comunicados, user]);

  const showSearch = ["/app", "/app/", "/app/alunos", "/app/turmas"].includes(location.pathname);

  const [uploadPhoto, { isLoading: isUploadingPhoto }] = useUploadPhotoMutation();

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleChangePassword = () => {
    handleMenuClose();
    navigate("/alterar-senha");
  };
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    window.location.href = "https://colaboraedu.cloud/";
  };

  const handleAddPhoto = () => {
    handleMenuClose();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          await uploadPhoto(formData).unwrap();
          // updateUser is handled by DashboardLayout via getMe invalidation
          alert("Foto enviada com sucesso! A imagem será atualizada em instantes.");
        } catch (error) {
          console.error("Failed to upload photo", error);
          alert("Erro ao enviar foto. Tente novamente.");
        }
      }
    };
    input.click();
  };

  const handleNotifOpen = (event: MouseEvent<HTMLElement>) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider"
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          sx={{ display: { xs: "flex", md: "none" }, ml: -1 }}
        >
          <MenuIcon />
        </IconButton>

        {showSearch && (
          <TextField
            placeholder="Buscar alunos, turmas…"
            size="small"
            sx={{ maxWidth: { xs: 200, sm: 320 }, display: { xs: "none", sm: "flex" } }}
            value={searchVal}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        )}
      </Box>

      <Box display="flex" alignItems="center" gap={2}>
        {/* Tenant Selector (Super Admin only) */}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <TenantSelector />
        </Box>

        {/* Academic Year Selector */}
        <Box sx={{ display: "block" }}>
          <AcademicYearSelector />
        </Box>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <IconButton
          color="inherit"
          size="small"
          onClick={handleNotifOpen}
          sx={{
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover"
            }
          }}
        >
          <Badge color="error" variant="dot" invisible={unreadCount === 0}>
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: { mt: 1, minWidth: 320, maxWidth: 320, maxHeight: 400, borderRadius: 2 }
            }
          }}
        >
          <Box px={2} py={1.5} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>Notificações</Typography>
            {unreadCount > 0 && <Chip label={`${unreadCount} novas`} size="small" color="primary" sx={{ height: 20, fontSize: "0.7rem" }} />}
          </Box>
          <Divider />
          <Box sx={{ maxHeight: 330, overflowY: "auto" }}>
            {comunicados && comunicados.length > 0 ? (
              comunicados.slice(0, 5).map((c) => (
                <MenuItem
                  key={c.id}
                  onClick={() => {
                    handleNotifClose();
                    navigate("/app/comunicados");
                  }}
                  sx={{
                    whiteSpace: "normal",
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: (user?.role === "aluno" && !c.is_read) ? "action.hover" : "transparent"
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} noWrap>{c.titulo}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {new Date(c.data_envio).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.2
                      }}
                    >
                      {c.conteudo}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <Box p={4} textAlign="center">
                <Typography variant="body2" color="text.secondary">Nenhuma notificação</Typography>
              </Box>
            )}
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              handleNotifClose();
              navigate("/app/comunicados");
            }}
            sx={{ justifyContent: "center", py: 1 }}
          >
            <Typography variant="caption" color="primary.main" fontWeight={700}>Ver todas</Typography>
          </MenuItem>
        </Menu>

        {/* User Menu */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            cursor: "pointer",
            px: { xs: 0.5, sm: 1.5 },
            py: 0.75,
            borderRadius: 1,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover"
            }
          }}
          onClick={handleMenuOpen}
          aria-controls={menuOpen ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <Avatar
            src={user?.photo_url ? `${user.photo_url}${user.photo_url.includes('?') ? '&' : '?'}t=${Date.now()}` : undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: "0.875rem",
              fontWeight: 700
            }}
          >
            {getInitials(user?.username)}
          </Avatar>
          <Box textAlign="left" sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
              {user?.username ?? "Usuário ativo"}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
              {ROLE_LABELS[user?.role?.toLowerCase() ?? ""] ?? "Perfil padrão"}
            </Typography>
          </Box>
        </Box>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 1
              }
            }
          }}
        >
          <Box px={2} py={1.5}>
            <Typography variant="body2" fontWeight={600}>
              {user?.username ?? "Usuário"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role ?? "Perfil padrão"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleAddPhoto}>
            <ListItemIcon>
              <AddAPhotoIcon fontSize="small" />
            </ListItemIcon>
            Acrescentar foto
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            Alterar senha
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
