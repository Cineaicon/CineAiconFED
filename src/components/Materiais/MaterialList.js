import React, { useState, useEffect } from 'react';
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
  Category,
  Inventory,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { materialService } from '../../services/api';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

const MaterialList = () => {
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll();
      // Garantir que todos os materiais tenham o campo categoria definido
      const materiaisComCategoria = (response.data || []).map(material => ({
        ...material,
        categoria: material.categoria || null
      }));
      setMateriais(materiaisComCategoria);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar materiais: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await materialService.delete(deleteDialog.id);
      setSnackbar({
        open: true,
        message: 'Material excluído com sucesso!',
        severity: 'success',
      });
      loadMateriais();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir material: ' + (error.response?.data?.message || error.message),
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
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const categoria = params.value;
                      const temCategoria = categoria && typeof categoria === 'string' && categoria.trim().length > 0;
                      
                      return temCategoria ? (
                        <Box display="flex" alignItems="center">
                          <Category sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Chip
                            label={categoria.trim()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center">
                          <Category sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} />
                          <Chip
                            label="Sem categoria"
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ opacity: 0.6 }}
                          />
                        </Box>
                      );
      },
    },
    {
      field: 'equipamento',
      headerName: 'Equipamento',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
                    <Box display="flex" alignItems="center">
                      <Inventory sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2" fontWeight="bold">
            {params.value || 'Sem nome'}
                      </Typography>
                    </Box>
      ),
    },
    {
      field: 'custoDiario',
      headerName: 'Custo Diário',
      width: 150,
      renderCell: (params) => (
                    <Typography variant="body2" fontWeight="bold" color="success.main">
          R$ {(parseFloat(params.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
      ),
    },
    {
      field: 'quantidadeDisponivel',
      headerName: 'Quantidade Disponível',
      width: 180,
      renderCell: (params) => (
                    <Typography variant="body2">
          {params.value || 0} unidades
                    </Typography>
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
            onClick={() => navigate(`/materiais/${params.row._id}/editar`)}
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

  const filteredMateriais = Array.isArray(materiais) ? materiais.filter((material) =>
    material.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.equipamento?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Materiais/Equipamentos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/materiais/novo')}
          >
            Novo Material
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por categoria ou equipamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ mb: 3 }}
        />

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredMateriais}
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
            Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.
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

export default MaterialList;


