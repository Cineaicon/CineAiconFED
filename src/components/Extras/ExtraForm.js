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
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { extraService } from '../../services/api';

const CATEGORIAS = [
  'FRETE',
  'TRANSPORTE',
  'ALIMENTACAO',
  'HOSPEDAGEM',
  'EQUIPAMENTO_ADICIONAL',
  'SERVICO',
  'OUTROS',
];

function ExtraForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    categoria: '',
    equipamento: '',
    custoDiario: 0,
    quantidadeDisponivel: 0,
    ativo: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      loadExtra();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadExtra = async () => {
    try {
      setLoading(true);
      const data = await extraService.getById(id);
      setFormData(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar extra: ' + (error.response?.data?.message || error.message),
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

    if (!formData.categoria?.trim()) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.equipamento?.trim()) {
      newErrors.equipamento = 'Equipamento é obrigatório';
    }

    if (formData.custoDiario < 0) {
      newErrors.custoDiario = 'Custo diário não pode ser negativo';
    }

    if (formData.quantidadeDisponivel < 0) {
      newErrors.quantidadeDisponivel = 'Quantidade disponível não pode ser negativa';
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
      if (isEditMode) {
        await extraService.update(id, formData);
        setSnackbar({
          open: true,
          message: 'Extra atualizado com sucesso!',
          severity: 'success',
        });
      } else {
        await extraService.create(formData);
        setSnackbar({
          open: true,
          message: 'Extra criado com sucesso!',
          severity: 'success',
        });
      }
      setTimeout(() => navigate('/extras'), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao salvar extra: ' + (error.response?.data?.message || error.message),
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
            onClick={() => navigate('/extras')}
            sx={{ mr: 2 }}
          >
            Voltar
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Editar Extra' : 'Novo Extra'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                error={Boolean(errors.categoria)}
                helperText={errors.categoria}
                required
              >
                {CATEGORIAS.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Equipamento / Descrição"
                name="equipamento"
                value={formData.equipamento}
                onChange={handleChange}
                error={Boolean(errors.equipamento)}
                helperText={errors.equipamento}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custo Diário"
                name="custoDiario"
                type="number"
                value={formData.custoDiario}
                onChange={handleChange}
                error={Boolean(errors.custoDiario)}
                helperText={errors.custoDiario}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                }}
                inputProps={{
                  step: '0.01',
                  min: '0',
                }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantidade Disponível"
                name="quantidadeDisponivel"
                type="number"
                value={formData.quantidadeDisponivel}
                onChange={handleChange}
                error={Boolean(errors.quantidadeDisponivel)}
                helperText={errors.quantidadeDisponivel}
                inputProps={{
                  min: '0',
                }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/extras')}
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

export default ExtraForm;



















