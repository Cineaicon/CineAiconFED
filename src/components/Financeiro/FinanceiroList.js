import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  CheckCircle as PaidIcon,
  Cancel as UnpaidIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { financeiroService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function FinanceiroList() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDialog, setPaymentDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [registrosData, resumoData] = await Promise.all([
        financeiroService.getAll(),
        financeiroService.getResumo(),
      ]);
      setRegistros(registrosData);
      setResumo(resumoData);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar dados financeiros: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await financeiroService.updateStatus(paymentDialog.id, 'PAGO');
      setSnackbar({
        open: true,
        message: 'Pagamento registrado com sucesso!',
        severity: 'success',
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao registrar pagamento: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setPaymentDialog({ open: false, id: null });
    }
  };

  const columns = [
    {
      field: 'jobNome',
      headerName: 'Job',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'clienteNome',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'dataOrcamento',
      headerName: 'Data Orçamento',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        try {
          return format(parseISO(params.value), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
          return '-';
        }
      },
    },
    {
      field: 'diarias',
      headerName: 'Diárias',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'valorTotal',
      headerName: 'Valor Total',
      width: 150,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(params.value || 0);
      },
    },
    {
      field: 'valorPago',
      headerName: 'Valor Pago',
      width: 150,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(params.value || 0);
      },
    },
    {
      field: 'dataVencimento',
      headerName: 'Vencimento',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        try {
          return format(parseISO(params.value), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
          return '-';
        }
      },
    },
    {
      field: 'statusPagamento',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 'PAGO' ? 'Pago' : 'Não Pago'}
          color={params.value === 'PAGO' ? 'success' : 'warning'}
          size="small"
          icon={params.value === 'PAGO' ? <PaidIcon /> : <UnpaidIcon />}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/financeiro/${params.row._id}`)}
            title="Visualizar"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          {params.row.statusPagamento !== 'PAGO' && (
            <IconButton
              size="small"
              color="success"
              onClick={() => setPaymentDialog({ open: true, id: params.row._id })}
              title="Marcar como Pago"
            >
              <PaymentIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  const filteredRegistros = registros.filter((registro) =>
    registro.jobNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registro.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Resumo Financeiro */}
      {resumo && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total de Orçamentos
                </Typography>
                <Typography variant="h4">
                  {resumo.totalOrcamentos || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Valor Total
                </Typography>
                <Typography variant="h4" color="primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(resumo.valorTotal || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Valor Pago
                </Typography>
                <Typography variant="h4" color="success.main">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(resumo.valorPago || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Valor Pendente
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(resumo.valorPendente || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Financeiro
          </Typography>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
            onClick={() => navigate('/relatorios')}
          >
            Relatórios
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por job ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredRegistros}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={loading}
            disableSelectionOnClick
            getRowId={(row) => row._id}
            components={{
              Toolbar: CustomToolbar,
            }}
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </Box>
      </Paper>

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Pagamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja marcar este registro como pago?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleMarkAsPaid} color="success" variant="contained">
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default FinanceiroList;




