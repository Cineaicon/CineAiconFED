import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  PictureAsPdf,
  CheckCircle,
  Cancel,
  LocalShipping,
  ContentCopy,
  AddCircleOutline,
  Delete,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { orcamentoService, materialService } from '../../services/api';
import Autocomplete from '@mui/material/Autocomplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatusChip = ({ status }) => {
  const statusConfig = {
    PENDENTE: { color: 'warning', icon: <Cancel />, label: 'Pendente' },
    CONFIRMADO: { color: 'info', icon: <CheckCircle />, label: 'Confirmado' },
    DEVOLVIDO: { color: 'success', icon: <CheckCircle />, label: 'Devolvido' },
    CANCELADO: { color: 'error', icon: <Cancel />, label: 'Cancelado' },
  };

  const config = statusConfig[status] || statusConfig.PENDENTE;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
    />
  );
};

const OrcamentoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [devolucaoDialogOpen, setDevolucaoDialogOpen] = useState(false);
  const [devolucaoData, setDevolucaoData] = useState({
    dataDevolucaoReal: format(new Date(), 'yyyy-MM-dd'),
    observacao: '',
  });

  const extraVazio = { materialId: null, categoria: '', equipamento: '', quantidade: 1, dias: 1, custoDiario: '', descontoPercentual: 0 };
  const [extrasDialogOpen, setExtrasDialogOpen] = useState(false);
  const [extraEditando, setExtraEditando] = useState(null);
  const [extraForm, setExtraForm] = useState(extraVazio);
  const [extraLoading, setExtraLoading] = useState(false);
  const [materiais, setMateriais] = useState([]);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);

  useEffect(() => {
    loadOrcamento();
    materialService.getAll().then(r => setMateriais(r.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrcamento = async () => {
    try {
      setLoading(true);
      const response = await orcamentoService.getById(id);
      setOrcamento(response.data);
    } catch (err) {
      console.error('Erro ao carregar orçamento:', err);
      setError('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/orcamentos/${id}/editar`);
    handleMenuClose();
  };

  const handleStatusChange = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleClone = async () => {
    try {
      setError(null);
      const response = await orcamentoService.clone(id);
      // Redirecionar para o novo orçamento clonado
      navigate(`/orcamentos/${response.data._id}`);
    } catch (err) {
      console.error('Erro ao clonar orçamento:', err);
      setError(err.response?.data?.message || 'Erro ao clonar orçamento');
    }
    handleMenuClose();
  };

  const confirmStatusChange = async () => {
    try {
      await orcamentoService.updateStatus(id, newStatus);
      loadOrcamento();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status');
    }
    setStatusDialogOpen(false);
    setNewStatus('');
  };

  const handleGeneratePDF = async (tipo) => {
    try {
      const response = await orcamentoService.generatePDF(id, tipo);
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}-${orcamento.numero}.pdf`);
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

  const handleOpenDevolucao = () => {
    setDevolucaoDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDevolucao = async () => {
    try {
      setError(null); // Limpar erro anterior
      
      // Verificar status atual antes de tentar atualizar
      if (orcamento?.status !== 'CONFIRMADO') {
        setError(`Não é possível marcar como devolvido. Status atual: ${orcamento?.status || 'desconhecido'}. Apenas orçamentos CONFIRMADOS podem ser marcados como DEVOLVIDO.`);
        return;
      }
      
      // Atualizar status e dados de devolução em uma única chamada
      const response = await orcamentoService.updateStatus(id, 'DEVOLVIDO', {
        dataDevolucaoReal: devolucaoData.dataDevolucaoReal,
        observacao: devolucaoData.observacao,
      });
      
      console.log('Status atualizado com sucesso:', response.data);
      
      loadOrcamento();
      setDevolucaoDialogOpen(false);
      setDevolucaoData({
        dataDevolucaoReal: format(new Date(), 'yyyy-MM-dd'),
        observacao: '',
      });
    } catch (err) {
      console.error('Erro ao marcar devolução:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao marcar devolução';
      setError(errorMessage);
      console.error('Detalhes do erro:', {
        status: err.response?.status,
        data: err.response?.data,
        statusAtual: orcamento?.status,
      });
    }
  };

  // Calcular desconto total (descontos de itens + desconto geral) e peso total
  const { subtotal, descontoItens, descontoGeral, descontoTotal, totalFinal, pesoTotal } = useMemo(() => {
    if (!orcamento || !orcamento.itens) {
      return {
        subtotal: 0,
        descontoItens: 0,
        descontoGeral: 0,
        descontoTotal: 0,
        totalFinal: 0,
        pesoTotal: 0
      };
    }

    // Calcular subtotal (soma dos valores totais dos itens sem desconto)
    const subtotalCalculado = orcamento.itens.reduce((sum, item) => {
      return sum + (parseFloat(item.valorTotal || item.valorUnitario * item.quantidade * item.dias || 0));
    }, 0);

    // Calcular desconto dos itens individuais (diferença entre valorTotal e valorFinal de cada item)
    const descontoItensCalculado = orcamento.itens.reduce((sum, item) => {
      const valorTotalItem = parseFloat(item.valorTotal || item.valorUnitario * item.quantidade * item.dias || 0);
      const valorFinalItem = parseFloat(item.valorFinal || valorTotalItem);
      return sum + (valorTotalItem - valorFinalItem);
    }, 0);

    // Peso total: soma de (quantidade * peso unitário) de cada item
    const pesoTotalCalculado = orcamento.itens.reduce((sum, item) => {
      const pesoUnit = item.peso != null && item.peso !== '' ? parseFloat(item.peso) : 0;
      const qty = Number(item.quantidade) || 0;
      return sum + qty * pesoUnit;
    }, 0);

    // Calcular desconto geral
    let descontoGeralCalculado = 0;
    if (orcamento.descontoGeral && parseFloat(orcamento.descontoGeral) > 0) {
      // Desconto percentual - aplicado sobre o subtotal após descontos dos itens
      const subtotalAposDescontosItens = subtotalCalculado - descontoItensCalculado;
      descontoGeralCalculado = (subtotalAposDescontosItens * parseFloat(orcamento.descontoGeral)) / 100;
    } else if (orcamento.descontoValorGeral && parseFloat(orcamento.descontoValorGeral) > 0) {
      // Desconto em valor
      descontoGeralCalculado = parseFloat(orcamento.descontoValorGeral);
    }

    const descontoTotalCalculado = descontoItensCalculado + descontoGeralCalculado;
    const totalFinalCalculado = subtotalCalculado - descontoTotalCalculado;

    return {
      subtotal: Number(subtotalCalculado.toFixed(2)),
      descontoItens: Number(descontoItensCalculado.toFixed(2)),
      descontoGeral: Number(descontoGeralCalculado.toFixed(2)),
      descontoTotal: Number(descontoTotalCalculado.toFixed(2)),
      totalFinal: Number(Math.max(totalFinalCalculado, 0).toFixed(2)),
      pesoTotal: Number(pesoTotalCalculado.toFixed(2))
    };
  }, [orcamento]);

  const handleAbrirNovoExtra = () => {
    setExtraEditando(null);
    setExtraForm(extraVazio);
    setMaterialSelecionado(null);
    setExtrasDialogOpen(true);
  };

  const handleAbrirEditarExtra = (extra) => {
    setExtraEditando(extra);
    const mat = materiais.find(m => m._id === (extra.materialId?._id || extra.materialId)) || null;
    setMaterialSelecionado(mat);
    setExtraForm({
      materialId: extra.materialId || null,
      categoria: extra.categoria || '',
      equipamento: extra.equipamento || '',
      quantidade: extra.quantidade || 1,
      dias: extra.dias || 1,
      custoDiario: extra.custoDiario ?? '',
      descontoPercentual: extra.descontoPercentual || 0,
    });
    setExtrasDialogOpen(true);
  };

  const handleSalvarExtra = async () => {
    try {
      setExtraLoading(true);
      if (extraEditando) {
        await orcamentoService.updateExtra(id, extraEditando._id, extraForm);
      } else {
        await orcamentoService.addExtra(id, extraForm);
      }
      await loadOrcamento();
      setExtrasDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar extra');
    } finally {
      setExtraLoading(false);
    }
  };

  const handleRemoverExtra = async (extraId) => {
    try {
      await orcamentoService.removeExtra(id, extraId);
      await loadOrcamento();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao remover extra');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando orçamento...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
        <Button variant="contained" onClick={loadOrcamento} sx={{ mt: 2 }}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  if (!orcamento) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Orçamento não encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {orcamento.numero} - {orcamento.jobName}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <StatusChip status={orcamento.status} />
            <Typography variant="body2" color="text.secondary">
              Criado em {format(new Date(orcamento.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => {
              if (location.state && (typeof location.state.page === 'number' || typeof location.state.rowsPerPage === 'number')) {
                navigate('/orcamentos', {
                  state: {
                    page: typeof location.state.page === 'number' ? location.state.page : 0,
                    rowsPerPage: typeof location.state.rowsPerPage === 'number' ? location.state.rowsPerPage : 10,
                  },
                });
              } else {
                navigate('/orcamentos');
              }
            }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Editar
          </Button>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Informações Básicas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Cliente
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Nome"
                    secondary={orcamento.clienteNome || orcamento.clienteId?.nome || 'Cliente não encontrado'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Telefone"
                    secondary={orcamento.clienteTelefone || orcamento.clienteId?.telefone || '-'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Documento"
                    secondary={orcamento.clienteDocumento || orcamento.clienteId?.documento || '-'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Endereço"
                    secondary={orcamento.clienteEndereco || `${orcamento.clienteId?.endereco || ''} ${orcamento.clienteId?.numero || ''}, ${orcamento.clienteId?.bairro || ''} - ${orcamento.clienteId?.municipio || ''}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Projeto
              </Typography>
              <List dense>
                <ListItem>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                  <ListItemText
                    primary="Responsável"
                    secondary={orcamento.colaboradorNome || orcamento.colaboradorId?.nome || 'Não definido'}
                  />
                    </Grid>
                    <Grid item xs={6}>
                      <ListItemText
                        primary="Dir. Fotografia"
                        secondary={orcamento.dirFotografia || '-'}
                      />
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <ListItemText
                        primary="Produtor"
                        secondary={orcamento.produtor || '-'}
                      />
                    </Grid>
                    <Grid item xs={6}>
                  <ListItemText
                        primary="Maquinista"
                        secondary={orcamento.maquinista || '-'}
                  />
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Diretor"
                    secondary={orcamento.diretor || '-'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Eletricista"
                    secondary={orcamento.eletricista || '-'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Datas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cronograma
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data de Início
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {orcamento.dataInicio ? format(new Date(orcamento.dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data de Fim (Devolução)
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {orcamento.dataFim ? format(new Date(orcamento.dataFim), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data de Pagamento
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {orcamento.dataPagamento ? format(new Date(orcamento.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data de Aprovação
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {orcamento.dataAprovacao ? format(new Date(orcamento.dataAprovacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data de Conclusão
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {orcamento.dataConclusao ? format(new Date(orcamento.dataConclusao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Itens do Orçamento */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Itens do Orçamento ({orcamento.itens?.length || 0})
          </Typography>
          {orcamento.itens && orcamento.itens.length > 0 ? (
            <List>
              {orcamento.itens.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="bold">
                            {index + 1}. {item.equipamento}
                          </Typography>
                          <Chip
                            label={item.categoria}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Quantidade: {item.quantidade} | Dias: {item.dias} | 
                            Valor/Dia: R$ {(item.custoDiario || item.valorUnitario || 0).toFixed(2)}
                          </Typography>
                          {item.descontoPercentual > 0 && (
                            <Typography variant="body2" color="success.main">
                              Desconto: {item.descontoPercentual}% (-R$ {parseFloat(item.valorDesconto || 0).toFixed(2)})
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body1" fontWeight="bold">
                        R$ {(parseFloat(item.totalItem || item.valorFinal || 0) - parseFloat(item.valorDesconto || 0)).toFixed(2)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < orcamento.itens.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhum item adicionado ao orçamento.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Extras do Orçamento */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">
              Extras ({orcamento.extras?.length || 0})
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleOutline />}
              onClick={handleAbrirNovoExtra}
            >
              Incluir Extra
            </Button>
          </Box>
          {orcamento.extras && orcamento.extras.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Categoria</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell align="center"><strong>Qtd</strong></TableCell>
                  <TableCell align="center"><strong>Dias</strong></TableCell>
                  <TableCell align="right"><strong>Custo/Dia</strong></TableCell>
                  <TableCell align="center"><strong>Desc. %</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orcamento.extras.map((extra) => {
                  const bruto = (extra.quantidade || 0) * (extra.dias || 0) * (extra.custoDiario || 0);
                  const descVal = extra.descontoPercentual > 0 ? (bruto * extra.descontoPercentual) / 100 : 0;
                  const final = Math.max(0, bruto - descVal);
                  return (
                    <TableRow key={extra._id} hover>
                      <TableCell>{extra.categoria || '-'}</TableCell>
                      <TableCell>{extra.equipamento || '-'}</TableCell>
                      <TableCell align="center">{extra.quantidade}</TableCell>
                      <TableCell align="center">{extra.dias}</TableCell>
                      <TableCell align="right">R$ {(extra.custoDiario || 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell align="center">
                        {extra.descontoPercentual > 0 ? (
                          <Chip label={`${extra.descontoPercentual}%`} size="small" color="success" variant="outlined" />
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right"><strong>R$ {final.toFixed(2).replace('.', ',')}</strong></TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleAbrirEditarExtra(extra)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" color="error" onClick={() => handleRemoverExtra(extra._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Nenhum extra adicionado. Clique em "Incluir Extra" para adicionar.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumo Financeiro
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  Desconto Total
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={descontoTotal > 0 ? "error.main" : "success.main"}>
                  {descontoTotal > 0 ? '-' : ''} R$ {descontoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                {descontoTotal > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {descontoItens > 0 && `Itens: R$ ${descontoItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    {descontoItens > 0 && descontoGeral > 0 && ' + '}
                    {descontoGeral > 0 && `Geral: R$ ${descontoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={2} bgcolor="primary.main" color="white" borderRadius={1}>
                <Typography variant="body2">
                  Total Final
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  Peso total
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {pesoTotal > 0 ? `${pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg` : '-'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ações de PDF */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gerar Documentos
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleGeneratePDF('orcamento')}
            >
              PDF Orçamento
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleGeneratePDF('fatura')}
            >
              PDF Fatura
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleGeneratePDF('checklist')}
            >
              PDF Checklist
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleGeneratePDF('contrato')}
              color="primary"
            >
              PDF Contrato
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleGeneratePDF('extras')}
              color="secondary"
              disabled={!orcamento.extras || orcamento.extras.length === 0}
            >
              PDF Extras
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
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
        {orcamento?.status === 'CONFIRMADO' && (
          <MenuItem onClick={handleOpenDevolucao}>
            <LocalShipping sx={{ mr: 1 }} />
            Marcar como Devolvido
          </MenuItem>
        )}
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

      {/* Dialog de Extras */}
      <Dialog
        open={extrasDialogOpen}
        onClose={() => setExtrasDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{extraEditando ? 'Editar Extra' : 'Incluir Extra'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={materiais}
              value={materialSelecionado}
              getOptionLabel={(op) => op ? `${op.equipamento} — R$ ${(op.custoDiario || 0).toFixed(2).replace('.', ',')}` : ''}
              filterOptions={(options, { inputValue }) => {
                const term = (inputValue || '').toLowerCase();
                return options.filter(op =>
                  (op.equipamento || '').toLowerCase().includes(term) ||
                  (op.categoria || '').toLowerCase().includes(term)
                );
              }}
              onChange={(_, newValue) => {
                setMaterialSelecionado(newValue);
                if (newValue) {
                  setExtraForm(prev => ({
                    ...prev,
                    materialId: newValue._id,
                    categoria: newValue.categoria || '',
                    equipamento: newValue.equipamento || '',
                    custoDiario: newValue.custoDiario ?? '',
                  }));
                } else {
                  setExtraForm(prev => ({ ...prev, materialId: null, categoria: '', equipamento: '', custoDiario: '' }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Equipamento / Material" placeholder="Buscar por nome ou categoria..." />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">{option.equipamento}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.categoria} · R$ {(option.custoDiario || 0).toFixed(2).replace('.', ',')}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Nenhum material encontrado"
            />
            {materialSelecionado && (
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip label={`Categoria: ${extraForm.categoria || '-'}`} size="small" variant="outlined" />
                <Chip label={`Custo/dia: R$ ${Number(extraForm.custoDiario || 0).toFixed(2).replace('.', ',')}`} size="small" color="primary" variant="outlined" />
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantidade"
                  value={extraForm.quantidade}
                  onChange={(e) => setExtraForm({ ...extraForm, quantidade: Number(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Dias"
                  value={extraForm.dias}
                  onChange={(e) => setExtraForm({ ...extraForm, dias: Number(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Custo por Dia (R$)"
                  value={extraForm.custoDiario}
                  onChange={(e) => setExtraForm({ ...extraForm, custoDiario: e.target.value })}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Preenchido automaticamente pelo material"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Desconto (%)"
                  value={extraForm.descontoPercentual}
                  onChange={(e) => setExtraForm({ ...extraForm, descontoPercentual: Number(e.target.value) })}
                  inputProps={{ min: 0, max: 100, step: '0.01' }}
                />
              </Grid>
            </Grid>
            {extraForm.custoDiario !== '' && (
              <Box p={1.5} bgcolor="primary.main" color="white" borderRadius={1} textAlign="center">
                <Typography variant="body2">Total estimado</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {(() => {
                    const bruto = (Number(extraForm.quantidade) || 0) * (Number(extraForm.dias) || 0) * (Number(extraForm.custoDiario) || 0);
                    const desc = Number(extraForm.descontoPercentual) || 0;
                    const final = Math.max(0, bruto - (desc > 0 ? (bruto * desc) / 100 : 0));
                    return `R$ ${final.toFixed(2).replace('.', ',')}`;
                  })()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtrasDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSalvarExtra}
            variant="contained"
            disabled={extraLoading || !extraForm.equipamento}
          >
            {extraLoading ? <CircularProgress size={20} /> : (extraEditando ? 'Salvar' : 'Incluir')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Devolução */}
      <Dialog
        open={devolucaoDialogOpen} 
        onClose={() => setDevolucaoDialogOpen(false)}
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
          <Button onClick={() => setDevolucaoDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDevolucao} 
            variant="contained"
            color="success"
            startIcon={<LocalShipping />}
          >
            Confirmar Devolução
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrcamentoDetail;

