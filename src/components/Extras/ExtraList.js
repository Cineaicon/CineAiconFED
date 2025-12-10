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
  Fab,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { extraService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function ExtraList() {
  const navigate = useNavigate();
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadExtras();
  }, []);

  const loadExtras = async () => {
    try {
      setLoading(true);
      const data = await extraService.getAll();
      setExtras(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar extras: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await extraService.delete(deleteDialog.id);
      setSnackbar({
        open: true,
        message: 'Extra excluído com sucesso!',
        severity: 'success',
      });
      loadExtras();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir extra: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns = [
    {
      field: 'categoria',
      headerName: 'Categoria',
      width: 150,
    },
    {
      field: 'equipamento',
      headerName: 'Equipamento',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'custoDiario',
      headerName: 'Custo Diário',
      width: 150,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(params.value || 0);
      },
    },
    {
      field: 'quantidadeDisponivel',
      headerName: 'Qtd. Disponível',
      width: 150,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'ativo',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Ativo' : 'Inativo'}
          color={params.value ? 'success' : 'default'}
          size="small"
          icon={params.value ? <ActiveIcon /> : <InactiveIcon />}
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
            onClick={() => navigate(`/extras/${params.row._id}/editar`)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteDialog({ open: true, id: params.row._id })}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredExtras = extras.filter((extra) =>
    extra.equipamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Extras
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/extras/novo')}
          >
            Novo Extra
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por equipamento ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredExtras}
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

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/extras/novo')}
      >
        <AddIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este extra? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
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

export default ExtraList;



















