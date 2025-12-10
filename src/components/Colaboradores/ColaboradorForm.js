import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { colaboradorService } from '../../services/api';

function ColaboradorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    endereco: '',
    cpf: '',
    ativo: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      loadColaborador();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadColaborador = async () => {
    try {
      setLoading(true);
      const response = await colaboradorService.getById(id);
      const data = response.data; // Acessar response.data corretamente
      setFormData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cargo: data.cargo || '',
        endereco: data.endereco || '',
        cpf: data.cpf || '',
        ativo: data.ativo !== undefined ? data.ativo : true,
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar colaborador: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefone?.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (!formData.cargo?.trim()) {
      newErrors.cargo = 'Cargo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      // Garantir que o campo ativo sempre seja enviado (default: true)
      const dataToSave = {
        ...formData,
        ativo: formData.ativo !== undefined ? formData.ativo : true
      };
      
      if (isEditMode) {
        await colaboradorService.update(id, dataToSave);
        setSnackbar({
          open: true,
          message: 'Colaborador atualizado com sucesso!',
          severity: 'success',
        });
      } else {
        await colaboradorService.create(dataToSave);
        setSnackbar({
          open: true,
          message: 'Colaborador criado com sucesso!',
          severity: 'success',
        });
      }
      setTimeout(() => navigate('/colaboradores'), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao salvar colaborador: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/colaboradores')}
            sx={{ mr: 2 }}
          >
            Voltar
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Editar Colaborador' : 'Novo Colaborador'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                error={Boolean(errors.nome)}
                helperText={errors.nome}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={handleChange}
                    name="ativo"
                    color="primary"
                  />
                }
                label="Ativo"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                error={Boolean(errors.telefone)}
                helperText={errors.telefone}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                error={Boolean(errors.cargo)}
                helperText={errors.cargo}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                error={Boolean(errors.cpf)}
                helperText={errors.cpf}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/colaboradores')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ColaboradorForm;


