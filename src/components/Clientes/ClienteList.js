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
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { clienteService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

const ClienteList = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getAll();
      // Garantir que o data seja um array
      const data = Array.isArray(response.data) ? response.data : (response.data || []);
      setClientes(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar clientes: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await clienteService.delete(deleteDialog.id);
      setSnackbar({
        open: true,
        message: 'Cliente excluído com sucesso!',
        severity: 'success',
      });
      loadClientes();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir cliente: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns = [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'documento',
      headerName: 'Documento',
      width: 180,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'areaAtuacao',
      headerName: 'Área de Atuação',
      width: 180,
      renderCell: (params) => params.value ? (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
        />
      ) : '-',
    },
    {
      field: 'telefone',
      headerName: 'Telefone',
      width: 150,
      renderCell: (params) => params.value ? (
        <Box display="flex" alignItems="center">
          <Phone sx={{ fontSize: 16, mr: 0.5 }} />
          {params.value}
        </Box>
      ) : '-',
    },
    {
      field: 'municipio',
      headerName: 'Município',
      width: 150,
      renderCell: (params) => params.value ? (
        <Box display="flex" alignItems="center">
          <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
          {params.value}
        </Box>
      ) : '-',
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
            onClick={() => navigate(`/clientes/${params.row._id}/editar`)}
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

  const filteredClientes = Array.isArray(clientes) ? clientes.filter((cliente) =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.areaAtuacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.municipio?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Clientes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clientes/novo')}
          >
            Novo Cliente
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome, documento, área de atuação ou município..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredClientes}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
};

export default ClienteList;


