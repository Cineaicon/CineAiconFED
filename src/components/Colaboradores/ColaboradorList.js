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
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { colaboradorService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function ColaboradorList() {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadColaboradores();
  }, []);

  const loadColaboradores = async () => {
    try {
      setLoading(true);
      const response = await colaboradorService.getAll();
      // Garantir que o data seja um array e que todos tenham o campo ativo definido
      const data = Array.isArray(response.data) ? response.data : (response.data || []);
      // Garantir que colaboradores sem campo 'ativo' sejam tratados como ativos (default: true)
      const dataNormalizada = data.map(colab => ({
        ...colab,
        ativo: colab.ativo !== undefined ? colab.ativo : true
      }));
      setColaboradores(dataNormalizada);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar colaboradores: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await colaboradorService.delete(deleteDialog.id);
      setSnackbar({
        open: true,
        message: 'Colaborador excluído com sucesso!',
        severity: 'success',
      });
      loadColaboradores();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir colaborador: ' + (error.response?.data?.message || error.message),
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
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'telefone',
      headerName: 'Telefone',
      width: 150,
    },
    {
      field: 'cargo',
      headerName: 'Cargo',
      width: 150,
    },
    {
      field: 'ativo',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        // Garantir que undefined/null seja tratado como ativo (true)
        const isAtivo = params.value !== undefined && params.value !== null ? params.value : true;
        return (
          <Chip
            label={isAtivo ? 'Ativo' : 'Inativo'}
            color={isAtivo ? 'success' : 'default'}
            size="small"
            icon={isAtivo ? <ActiveIcon /> : <InactiveIcon />}
          />
        );
      },
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
            onClick={() => navigate(`/colaboradores/${params.row._id}/editar`)}
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

  const filteredColaboradores = Array.isArray(colaboradores) ? colaboradores.filter((colaborador) =>
    colaborador.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Colaboradores
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/colaboradores/novo')}
          >
            Novo Colaborador
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome, email ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredColaboradores}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
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

export default ColaboradorList;


