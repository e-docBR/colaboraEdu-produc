import { Box, Button, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { AlunoSummary } from "../../lib/api";

interface AlunoFormProps {
    initialData?: Partial<AlunoSummary>;
    onSubmit: (data: Partial<AlunoSummary>) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const TURNOS = ["Matutino", "Vespertino", "Noturno"];

export const AlunoForm = ({ initialData, onSubmit, onCancel, isLoading }: AlunoFormProps) => {
    const [formData, setFormData] = useState<Partial<AlunoSummary>>({
        nome: "",
        matricula: "",
        turma: "",
        turno: "Matutino",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                required
                fullWidth
                label="Nome do Aluno"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                autoFocus
                size="small"
            />
            <TextField
                margin="normal"
                required
                fullWidth
                label="Matrícula"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                size="small"
            />
            <TextField
                margin="normal"
                required
                fullWidth
                label="Turma"
                name="turma"
                value={formData.turma}
                onChange={handleChange}
                size="small"
            />
            <TextField
                select
                margin="normal"
                required
                fullWidth
                label="Turno"
                name="turno"
                value={formData.turno}
                onChange={handleChange}
                size="small"
            >
                {TURNOS.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <TextField
                select
                margin="normal"
                fullWidth
                label="Situação Especial"
                name="status"
                value={formData.status ?? ""}
                onChange={handleChange}
                size="small"
                helperText="Use apenas para alunos Inativos/Fora da escola"
            >
                <MenuItem value="">
                    <em>Ativo (Nenhum)</em>
                </MenuItem>
                <MenuItem value="Cancelado">Cancelado</MenuItem>
                <MenuItem value="Transferido">Transferido</MenuItem>
                <MenuItem value="Desistente">Desistente</MenuItem>
            </TextField>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                >
                    {initialData?.id ? "Salvar Alterações" : "Criar Aluno"}
                </Button>
            </Box>
        </Box>
    );
};
