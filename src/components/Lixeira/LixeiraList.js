import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { lixeiraService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function LixeiraList() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreDialog, setRestoreDialog] = useState({ open: false, id: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orcamentosData, statsData] = await Promise.all([
        lixeiraService.getAll(),
        lixeiraService.getStats(),
      ]);
      setOrcamentos(orcamentosData);
      setStats(statsData);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar lixeira: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      await lixeiraService.restore(restoreDialog.id);
      setSnackbar({
        open: true,
        message: 'Orçamento restaurado com sucesso!',
        severity: 'success',
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao restaurar orçamento: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setRestoreDialog({ open: false, id: null });
    }
  };

  const handleDelete = async () => {
    try {
      await lixeiraService.delete(deleteDialog.id);
      setSnackbar({
        open: true,
        message: 'Orçamento excluído permanentemente!',
        severity: 'success',
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir orçamento: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns = [
    {
      field: 'jobNome',
      headerName: 'Job',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.orcamento?.jobNome || '-',
    },
    {
      field: 'clienteNome',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.orcamento?.clienteNome || '-',
    },
    {
      field: 'dataErro',
      headerName: 'Data de Exclusão',
      width: 150,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        try {
          return format(parseISO(params.value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch {
          return '-';
        }
      },
    },
    {
      field: 'erro',
      headerName: 'Motivo',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'restaurado',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Restaurado' : 'Na Lixeira'}
          color={params.value ? 'success' : 'default'}
          size="small"
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
          {!params.row.restaurado && (
            <>
              <IconButton
                size="small"
                color="success"
                onClick={() => setRestoreDialog({ open: true, id: params.row._id })}
                title="Restaurar"
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteDialog({ open: true, id: params.row._id })}
                title="Excluir Permanentemente"
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total na Lixeira
                </Typography>
                <Typography variant="h4">
                  {stats.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Restaurados
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.restaurados || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Não Restaurados
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.naoRestaurados || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Lixeira de Orçamentos
          </Typography>
        </Box>

        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          Orçamentos excluídos são movidos para a lixeira. Você pode restaurá-los ou excluí-los permanentemente.
        </Alert>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={orcamentos}
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

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialog.open}
        onClose={() => setRestoreDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Restauração</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja restaurar este orçamento? Ele será movido de volta para a lista de orçamentos ativos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleRestore} color="success" variant="contained">
            Restaurar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Exclusão Permanente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ATENÇÃO: Esta ação é IRREVERSÍVEL! Tem certeza que deseja excluir permanentemente este orçamento?
            Todos os dados serão perdidos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir Permanentemente
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

export default LixeiraList;



















