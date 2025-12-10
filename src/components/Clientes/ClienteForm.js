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
} from '@mui/material';
import {
  Save,
  Cancel,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { clienteService } from '../../services/api';

const ClienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nome: '',
      documento: '',
      areaAtuacao: '',
      telefone: '',
      municipio: '',
      CEP: '',
      endereco: '',
      numero: 0,
      bairro: '',
      complemento: '',
    }
  });

  useEffect(() => {
    if (id) {
      loadCliente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getById(id);
      const cliente = response.data;
      
      // Preencher formulário com dados do cliente usando reset
      reset({
        nome: cliente.nome || '',
        documento: cliente.documento || '',
        areaAtuacao: cliente.areaAtuacao || '',
        telefone: cliente.telefone || '',
        municipio: cliente.municipio || '',
        CEP: cliente.CEP || '',
        endereco: cliente.endereco || '',
        numero: cliente.numero || 0,
        bairro: cliente.bairro || '',
        complemento: cliente.complemento || '',
      });
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
      setError('Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setError(null);

      if (id) {
        await clienteService.update(id, data);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        await clienteService.create(data);
        setSuccess('Cliente criado com sucesso!');
      }

      setTimeout(() => {
        navigate('/clientes');
      }, 2000);

    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando cliente...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {id ? 'Editar Cliente' : 'Novo Cliente'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/clientes')}
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
              Informações Básicas
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  {...control.register('nome', { required: 'Nome é obrigatório' })}
                  error={!!errors.nome}
                  helperText={errors.nome?.message}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Documento (CPF/CNPJ)"
                  {...control.register('documento')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Área de Atuação"
                  {...control.register('areaAtuacao')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  {...control.register('telefone')}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Endereço
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Município"
                  {...control.register('municipio')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CEP"
                  {...control.register('CEP')}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  {...control.register('endereco')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número"
                  {...control.register('numero')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  {...control.register('bairro')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Complemento"
                  {...control.register('complemento')}
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
            onClick={() => navigate('/clientes')}
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
    </Box>
  );
};

export default ClienteForm;


