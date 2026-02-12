import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { materialService } from '../../services/api';

const MaterialForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [dialogNovaCategoria, setDialogNovaCategoria] = useState(false);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {
      categoria: '',
      equipamento: '',
      custoDiario: '0',
      quantidadeDisponivel: 0,
      quantidadeInventario: 0,
    }
  });

  useEffect(() => {
    loadCategorias();
    if (id) {
      loadMaterial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCategorias = async () => {
    try {
      const response = await materialService.getCategorias();
      setCategorias(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await materialService.getById(id);
      const material = response.data;
      
      // Preencher formulário com dados do material usando reset
      reset({
        categoria: material.categoria || '',
        equipamento: material.equipamento || '',
        custoDiario: material.custoDiario || '0',
        quantidadeDisponivel: material.quantidadeDisponivel || 0,
        quantidadeInventario: material.quantidadeInventario != null ? material.quantidadeInventario : 0,
      });
    } catch (err) {
      console.error('Erro ao carregar material:', err);
      setError('Erro ao carregar material');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarNovaCategoria = async () => {
    if (!novaCategoria.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    try {
      setSalvandoCategoria(true);
      setError(null);
      
      // Criar um material temporário apenas para adicionar a categoria ao sistema
      // A categoria será adicionada quando o material for salvo
      // Por enquanto, apenas adicionamos à lista local
      if (!categorias.includes(novaCategoria.trim())) {
        setCategorias([...categorias, novaCategoria.trim()].sort());
        setValue('categoria', novaCategoria.trim());
      }
      
      setDialogNovaCategoria(false);
      setNovaCategoria('');
      setSuccess('Categoria adicionada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      setError('Erro ao salvar categoria');
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setError(null);

      if (id) {
        await materialService.update(id, data);
        setSuccess('Material atualizado com sucesso!');
      } else {
        await materialService.create(data);
        setSuccess('Material criado com sucesso!');
      }

      // Recarregar categorias para incluir a nova se houver
      await loadCategorias();

      setTimeout(() => {
        navigate('/materiais');
      }, 2000);

    } catch (err) {
      console.error('Erro ao salvar material:', err);
      setError('Erro ao salvar material');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando material...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {id ? 'Editar Material' : 'Novo Material'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/materiais')}
          >
            Cancelar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informações do Material/Equipamento
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={1} alignItems="flex-start">
                  <Controller
                    name="categoria"
                    control={control}
                    rules={{ required: 'Categoria é obrigatória' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.categoria}>
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          {...field}
                          label="Categoria"
                          value={field.value || ''}
                        >
                          {categorias.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.categoria && (
                          <FormHelperText>{errors.categoria.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => setDialogNovaCategoria(true)}
                    sx={{ mt: 1 }}
                    title="Adicionar nova categoria"
                  >
                    <Add />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Equipamento"
                  {...control.register('equipamento', { required: 'Nome do equipamento é obrigatório' })}
                  error={!!errors.equipamento}
                  helperText={errors.equipamento?.message}
                  placeholder="Ex: Canon C70, ARRI SkyPanel S60..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Custo Diário (R$)"
                  {...control.register('custoDiario', { 
                    required: 'Custo diário é obrigatório',
                    min: { value: 0, message: 'Custo deve ser maior ou igual a 0' }
                  })}
                  error={!!errors.custoDiario}
                  helperText={errors.custoDiario?.message}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantidade Disponível"
                  {...control.register('quantidadeDisponivel', { 
                    required: 'Quantidade é obrigatória',
                    min: { value: 0, message: 'Quantidade deve ser maior ou igual a 0' }
                  })}
                  error={!!errors.quantidadeDisponivel}
                  helperText={errors.quantidadeDisponivel?.message}
                  inputProps={{ min: '0' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantidade no inventário"
                  {...control.register('quantidadeInventario', { 
                    min: { value: 0, message: 'Deve ser maior ou igual a 0' }
                  })}
                  error={!!errors.quantidadeInventario}
                  helperText="Quantidade total deste equipamento na casa (levantamento físico). Este valor alimenta a aba Inventário e o PDF de inventário. Pode ser preenchido agora ou depois na lista de Inventário."
                  inputProps={{ min: '0' }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Botões */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/materiais')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={saving}
          >
            {saving ? 'Salvando...' : id ? 'Atualizar' : 'Criar'}
          </Button>
        </Box>
      </form>

      {/* Dialog para Nova Categoria */}
      <Dialog
        open={dialogNovaCategoria}
        onClose={() => {
          setDialogNovaCategoria(false);
          setNovaCategoria('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Nova Categoria</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Categoria"
            fullWidth
            variant="outlined"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSalvarNovaCategoria();
              }
            }}
            placeholder="Ex: Câmera, Iluminação, Áudio..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogNovaCategoria(false);
              setNovaCategoria('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvarNovaCategoria}
            variant="contained"
            disabled={salvandoCategoria || !novaCategoria.trim()}
          >
            {salvandoCategoria ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialForm;


