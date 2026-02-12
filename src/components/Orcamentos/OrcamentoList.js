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
  Checkbox,
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
  ContentCopy,
  DeleteSweep,
  LocalShipping,
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
  const [orcamentoParaStatus, setOrcamentoParaStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [devolucaoDialogOpen, setDevolucaoDialogOpen] = useState(false);
  const [orcamentoDevolucaoId, setOrcamentoDevolucaoId] = useState(null);
  const [devolucaoData, setDevolucaoData] = useState({
    dataDevolucaoReal: format(new Date(), 'yyyy-MM-dd'),
    observacao: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleClone = async () => {
    try {
      setError(null);
      const response = await orcamentoService.clone(selectedOrcamento._id);
      // Redirecionar para o novo orçamento clonado
      navigate(`/orcamentos/${response.data._id}`);
    } catch (err) {
      console.error('Erro ao clonar orçamento:', err);
      setError(err.response?.data?.message || 'Erro ao clonar orçamento');
    }
    handleMenuClose();
  };

  const handleStatusChange = () => {
    if (selectedOrcamento) {
      setOrcamentoParaStatus({ _id: selectedOrcamento._id, status: selectedOrcamento.status });
      setNewStatus('');
      setStatusDialogOpen(true);
    }
    handleMenuClose();
  };

  const confirmStatusChange = async () => {
    if (!orcamentoParaStatus || !newStatus) return;
    try {
      setError(null);
      await orcamentoService.updateStatus(orcamentoParaStatus._id, newStatus);
      loadOrcamentos();
      setStatusDialogOpen(false);
      setOrcamentoParaStatus(null);
      setNewStatus('');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const handleOpenDevolucao = () => {
    if (selectedOrcamento) {
      setOrcamentoDevolucaoId(selectedOrcamento._id);
      setDevolucaoData({
        dataDevolucaoReal: format(new Date(), 'yyyy-MM-dd'),
        observacao: '',
      });
      setDevolucaoDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmDevolucao = async () => {
    if (!orcamentoDevolucaoId) return;
    try {
      setError(null);
      await orcamentoService.updateStatus(orcamentoDevolucaoId, 'DEVOLVIDO', {
        dataDevolucaoReal: devolucaoData.dataDevolucaoReal,
        observacao: devolucaoData.observacao,
      });
      loadOrcamentos();
      setDevolucaoDialogOpen(false);
      setOrcamentoDevolucaoId(null);
      setDevolucaoData({ dataDevolucaoReal: format(new Date(), 'yyyy-MM-dd'), observacao: '' });
    } catch (err) {
      console.error('Erro ao marcar devolução:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao marcar devolução');
    }
  };

  const statusTransitions = {
    PENDENTE: ['CONFIRMADO', 'CANCELADO'],
    CONFIRMADO: ['DEVOLVIDO', 'CANCELADO'],
    DEVOLVIDO: [],
    CANCELADO: ['PENDENTE'],
  };
  const opcoesStatus = orcamentoParaStatus ? (statusTransitions[orcamentoParaStatus.status] || []) : [];

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
    setSelectedIds([]); // Limpar seleção ao mudar de página
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedIds([]); // Limpar seleção ao mudar quantidade por página
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    setPage(0); // Resetar para primeira página ao buscar

    if (term === '') {
      setFilteredOrcamentos(orcamentos);
    } else {
      const clienteNome = (orcamento) =>
        (orcamento.clienteNome || orcamento.clienteId?.nome || '').toLowerCase();
      const filtered = orcamentos.filter(orcamento =>
        orcamento.jobName?.toLowerCase().includes(term) ||
        clienteNome(orcamento).includes(term)
      );
      setFilteredOrcamentos(filtered);
    }
    // Limpar seleção ao buscar
    setSelectedIds([]);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const currentPageIds = filteredOrcamentos
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(orcamento => orcamento._id);
      setSelectedIds(currentPageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }

    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      // Excluir todos os orçamentos selecionados
      await Promise.all(selectedIds.map(id => orcamentoService.delete(id)));
      
      // Recarregar lista e limpar seleção
      await loadOrcamentos();
      setSelectedIds([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Erro ao excluir orçamentos:', err);
      setError('Erro ao excluir orçamentos selecionados');
    } finally {
      setDeleting(false);
    }
  };

  const isSelected = (id) => selectedIds.indexOf(id) !== -1;
  
  const currentPageOrcamentos = filteredOrcamentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const currentPageIds = currentPageOrcamentos.map(orc => orc._id);
  const numSelected = selectedIds.length;
  const numSelectedInCurrentPage = currentPageIds.filter(id => selectedIds.includes(id)).length;
  const isAllSelected = currentPageOrcamentos.length > 0 && numSelectedInCurrentPage === currentPageOrcamentos.length;

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
          {numSelected > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Excluir Selecionados ({numSelected})
            </Button>
          )}
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
          placeholder="Buscar por job ou nome do cliente..."
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
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={numSelectedInCurrentPage > 0 && numSelectedInCurrentPage < currentPageOrcamentos.length}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    color="primary"
                  />
                </TableCell>
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
              {currentPageOrcamentos.map((orcamento) => {
                const isItemSelected = isSelected(orcamento._id);
                return (
                <TableRow 
                  key={orcamento._id} 
                  hover
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => handleSelectOne(orcamento._id)}
                      color="primary"
                    />
                  </TableCell>
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
                );
              })}
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
        <MenuItem onClick={handleClone}>
          <ContentCopy sx={{ mr: 1 }} />
          Clonar Orçamento
        </MenuItem>
        <MenuItem onClick={handleStatusChange}>
          <CheckCircle sx={{ mr: 1 }} />
          Alterar Status
        </MenuItem>
        {selectedOrcamento?.status === 'CONFIRMADO' && (
          <MenuItem onClick={handleOpenDevolucao}>
            <LocalShipping sx={{ mr: 1 }} />
            Marcar como Devolvido
          </MenuItem>
        )}
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

      {/* Dialog de Confirmação de Exclusão Múltipla */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir {numSelected} orçamento(s) selecionado(s)?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteSelected} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteSweep />}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Alteração de Status */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setOrcamentoParaStatus(null);
          setNewStatus('');
        }}
      >
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
            <MenuItem value="">Selecione um status</MenuItem>
            {opcoesStatus.includes('PENDENTE') && <MenuItem value="PENDENTE">Pendente</MenuItem>}
            {opcoesStatus.includes('CONFIRMADO') && <MenuItem value="CONFIRMADO">Confirmado</MenuItem>}
            {opcoesStatus.includes('DEVOLVIDO') && <MenuItem value="DEVOLVIDO">Devolvido</MenuItem>}
            {opcoesStatus.includes('CANCELADO') && <MenuItem value="CANCELADO">Cancelado</MenuItem>}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setStatusDialogOpen(false);
              setOrcamentoParaStatus(null);
              setNewStatus('');
            }}
          >
            Cancelar
          </Button>
          <Button onClick={confirmStatusChange} variant="contained" disabled={!newStatus}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Devolução (igual aos detalhes) */}
      <Dialog
        open={devolucaoDialogOpen}
        onClose={() => {
          setDevolucaoDialogOpen(false);
          setOrcamentoDevolucaoId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Marcar como Devolvido</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Data de Devolução Real"
              value={devolucaoData.dataDevolucaoReal}
              onChange={(e) => setDevolucaoData({ ...devolucaoData, dataDevolucaoReal: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Observações"
              value={devolucaoData.observacao}
              onChange={(e) => setDevolucaoData({ ...devolucaoData, observacao: e.target.value })}
              multiline
              rows={4}
              placeholder="Adicione observações sobre a devolução (opcional)..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDevolucaoDialogOpen(false);
              setOrcamentoDevolucaoId(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<LocalShipping />}
            onClick={handleConfirmDevolucao}
          >
            Confirmar Devolução
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrcamentoList;

