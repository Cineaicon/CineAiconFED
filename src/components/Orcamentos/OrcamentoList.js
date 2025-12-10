import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  Delete,
  PictureAsPdf,
  CheckCircle,
  Add,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orcamentoService } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatusChip = ({ status }) => {
  const statusConfig = {
    PENDENTE: { color: 'warning', label: 'Pendente' },
    CONFIRMADO: { color: 'info', label: 'Confirmado' },
    DEVOLVIDO: { color: 'success', label: 'Devolvido' },
    CANCELADO: { color: 'error', label: 'Cancelado' },
  };

  const config = statusConfig[status] || statusConfig.PENDENTE;

  return <Chip label={config.label} color={config.color} size="small" />;
};

const OrcamentoList = () => {
  const [orcamentos, setOrcamentos] = useState([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrcamento, setSelectedOrcamento] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      setLoading(true);
      const response = await orcamentoService.getAll({ limit: 1000 });
      // Ordenar por data de criação decrescente (mais recentes primeiro)
      const sortedOrcamentos = (response.data.data || []).sort((a, b) => 
        new Date(b.createdAt || b.dataCriacao) - new Date(a.createdAt || a.dataCriacao)
      );
      setOrcamentos(sortedOrcamentos);
      setFilteredOrcamentos(sortedOrcamentos);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
      setError('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, orcamento) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrcamento(orcamento);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrcamento(null);
  };

  const handleView = () => {
    navigate(`/orcamentos/${selectedOrcamento._id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/orcamentos/${selectedOrcamento._id}/editar`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await orcamentoService.delete(selectedOrcamento._id);
      loadOrcamentos();
    } catch (err) {
      console.error('Erro ao deletar orçamento:', err);
      setError('Erro ao deletar orçamento');
    }
    handleMenuClose();
  };

  const handleStatusChange = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const confirmStatusChange = async () => {
    try {
      await orcamentoService.updateStatus(selectedOrcamento._id, newStatus);
      loadOrcamentos();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status');
    }
    setStatusDialogOpen(false);
    setNewStatus('');
  };

  const handleGeneratePDF = async (tipo) => {
    try {
      const response = await orcamentoService.generatePDF(selectedOrcamento._id, tipo);
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}-${selectedOrcamento.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF');
    }
    handleMenuClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    setPage(0); // Resetar para primeira página ao buscar

    if (term === '') {
      setFilteredOrcamentos(orcamentos);
    } else {
      const filtered = orcamentos.filter(orcamento => 
        orcamento.jobName?.toLowerCase().includes(term)
      );
      setFilteredOrcamentos(filtered);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando orçamentos...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Orçamentos</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/orcamentos/novo')}
          >
            Novo Orçamento
          </Button>
        </Box>
      </Box>

      {/* Busca */}
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome do job..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabela de Orçamentos */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valor Total</TableCell>
                <TableCell>Data Criação</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrcamentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((orcamento) => (
                <TableRow key={orcamento._id} hover>
                  <TableCell>{orcamento.jobName}</TableCell>
                  <TableCell>
                    {orcamento.clienteNome || orcamento.clienteId?.nome || 'Cliente não encontrado'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={orcamento.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      R$ {(parseFloat(orcamento.valorTotalComDesconto || orcamento.valorFinal || orcamento.valorTotal || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {format(new Date(orcamento.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {orcamento.colaboradorNome || orcamento.colaboradorId?.nome || 'Não definido'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, orcamento)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrcamentos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleStatusChange}>
          <CheckCircle sx={{ mr: 1 }} />
          Alterar Status
        </MenuItem>
        <MenuItem onClick={() => handleGeneratePDF('orcamento')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          PDF Orçamento
        </MenuItem>
        <MenuItem onClick={() => handleGeneratePDF('fatura')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          PDF Fatura
        </MenuItem>
        <MenuItem onClick={() => handleGeneratePDF('checklist')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          PDF Checklist
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de Alteração de Status */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Alterar Status do Orçamento</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Novo Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">
              Selecione um status
            </MenuItem>
            <MenuItem value="PENDENTE">Pendente</MenuItem>
            <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
            <MenuItem value="DEVOLVIDO">Devolvido</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmStatusChange} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrcamentoList;

