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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  PictureAsPdf as PdfIcon,
  Inventory2 as InventarioIcon,
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

function InventarioQuantidadeCell({ materialId, value, salvando, onSave }) {
  const [local, setLocal] = useState(String(value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const handleBlur = () => {
    if (!dirty) return;
    const num = Math.max(0, parseInt(local, 10) || 0);
    setLocal(String(num));
    setDirty(false);
    if (num !== value) onSave(materialId, num);
  };

  return (
    <TextField
      type="number"
      size="small"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        setDirty(true);
      }}
      onBlur={handleBlur}
      inputProps={{ min: 0, step: 1 }}
      sx={{ width: 90 }}
      disabled={salvando}
      placeholder="0"
    />
  );
}

const MaterialList = () => {
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabAtiva, setTabAtiva] = useState(0);
  const [searchInventario, setSearchInventario] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [salvandoInventarioId, setSalvandoInventarioId] = useState(null);

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    try {
      setLoading(true);
      const response = await materialService.getAll();
      const raw = response.data || [];
      const materiaisComCategoria = raw.map(material => ({
        ...material,
        categoria: material.categoria || null,
        quantidadeInventario: material.quantidadeInventario != null ? Number(material.quantidadeInventario) : 0,
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

  const handleDownloadListaPdf = async () => {
    try {
      setLoadingPdf(true);
      const { data } = await materialService.downloadListaPdf();
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lista-materiais-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Lista de materiais baixada com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao baixar PDF: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleSalvarQuantidadeInventario = async (materialId, valor) => {
    const num = Math.max(0, parseInt(valor, 10) || 0);
    try {
      setSalvandoInventarioId(materialId);
      await materialService.update(materialId, { quantidadeInventario: num });
      setMateriais(prev => prev.map(m => (m._id === materialId ? { ...m, quantidadeInventario: num } : m)));
      setSnackbar({ open: true, message: 'Quantidade do inventário atualizada.', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao salvar: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    } finally {
      setSalvandoInventarioId(null);
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

  const filteredInventario = Array.isArray(materiais) ? materiais.filter((material) =>
    !searchInventario ||
    material.categoria?.toLowerCase().includes(searchInventario.toLowerCase()) ||
    material.equipamento?.toLowerCase().includes(searchInventario.toLowerCase())
  ) : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Materiais/Equipamentos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleDownloadListaPdf}
              disabled={loadingPdf}
            >
              {loadingPdf ? 'Gerando...' : 'Lista em PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/materiais/novo')}
            >
              Novo Material
            </Button>
          </Box>
        </Box>

        <Tabs value={tabAtiva} onChange={(_, v) => setTabAtiva(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab label="Materiais" icon={<Inventory />} iconPosition="start" />
          <Tab label="Inventário" icon={<InventarioIcon />} iconPosition="start" />
        </Tabs>

        {tabAtiva === 0 && (
          <>
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
          </>
        )}

        {tabAtiva === 1 && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quantidade total dos equipamentos na casa (levantamento). Edite a quantidade e salve; valores iniciais em zero para preenchimento no levantamento.
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Buscar por categoria ou equipamento..."
              value={searchInventario}
              onChange={(e) => setSearchInventario(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              sx={{ mb: 2, maxWidth: 400 }}
            />
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Equipamento</TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>Quantidade (inventário)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} align="center">Carregando...</TableCell></TableRow>
                  ) : (
                    filteredInventario.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell>
                          <Chip label={m.categoria || '—'} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell>{m.equipamento || '—'}</TableCell>
                        <TableCell align="right">
                          <InventarioQuantidadeCell
                            materialId={m._id}
                            value={m.quantidadeInventario ?? 0}
                            salvando={salvandoInventarioId === m._id}
                            onSave={handleSalvarQuantidadeInventario}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
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


