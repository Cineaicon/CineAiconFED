import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { financeiroService } from '../../services/api';

function FinanceiroDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadRegistro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRegistro = async () => {
    try {
      setLoading(true);
      const data = await financeiroService.getById(id);
      setRegistro(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar registro: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await financeiroService.updateStatus(id, 'PAGO');
      setSnackbar({
        open: true,
        message: 'Pagamento registrado com sucesso!',
        severity: 'success',
      });
      loadRegistro();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao registrar pagamento: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!registro) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Registro não encontrado</Alert>
      </Container>
    );
  }

  const valorPendente = (registro.valorTotal || 0) - (registro.valorPago || 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/financeiro')}
            sx={{ mr: 2 }}
          >
            Voltar
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Detalhes Financeiros
          </Typography>
          {registro.statusPagamento !== 'PAGO' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={handleMarkAsPaid}
            >
              Marcar como Pago
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Informações do Orçamento */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações do Orçamento
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Job
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {registro.jobNome || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Cliente
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {registro.clienteNome || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Data do Orçamento
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(registro.dataOrcamento)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Diárias
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {registro.diarias || 0} dias
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Informações Financeiras */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações Financeiras
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Valor Total
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatCurrency(registro.valorTotal)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Valor Pago
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {formatCurrency(registro.valorPago)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Valor Pendente
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              {formatCurrency(valorPendente)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Data de Vencimento
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(registro.dataVencimento)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Status do Pagamento
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={registro.statusPagamento === 'PAGO' ? 'Pago' : 'Não Pago'}
                color={registro.statusPagamento === 'PAGO' ? 'success' : 'warning'}
                size="medium"
              />
            </Box>
          </Grid>

          {registro.dataPagamento && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Data do Pagamento
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(registro.dataPagamento)}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Ações */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/orcamentos/${registro.orcamentoId}`)}
              >
                Ver Orçamento Completo
              </Button>
            </Box>
          </Grid>
        </Grid>
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

export default FinanceiroDetail;



















