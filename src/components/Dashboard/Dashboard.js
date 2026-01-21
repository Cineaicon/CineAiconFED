import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Receipt,
  People,
  Person,
  Inventory,
  CheckCircle,
  Pending,
  Cancel,
  Add,
  Event,
  Payment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orcamentoService, testService } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PaymentNotifications from '../Layout/PaymentNotifications';

const StatusChip = ({ status }) => {
  const statusConfig = {
    PENDENTE: { color: 'warning', icon: <Pending />, label: 'Pendente' },
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
      size="small"
      variant="outlined"
    />
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalOrcamentos: 0,
    orcamentosPendentes: 0,
    orcamentosAprovados: 0,
    orcamentosConcluidos: 0,
    valorTotal: 0,
  });
  const [recentOrcamentos, setRecentOrcamentos] = useState([]);
  const [proximosVencimentos, setProximosVencimentos] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const shouldShowFeaturesPanel = false;
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Testar conexão com backend
      const statusResponse = await testService.getStatus();
      setSystemStatus(statusResponse.data);

      // Carregar estatísticas
      const orcamentosResponse = await orcamentoService.getAll({ limit: 100 });
      const orcamentos = orcamentosResponse.data.data || [];
      const statusCounts = orcamentosResponse.data.summary?.statusCounts || {};
      const totalFromApi = orcamentosResponse.data.pagination?.total;

      const computedStats = {
        totalOrcamentos: typeof totalFromApi === 'number' ? totalFromApi : orcamentos.length,
        orcamentosPendentes: statusCounts.PENDENTE ?? orcamentos.filter(o => o.status === 'PENDENTE').length,
        orcamentosConfirmados: statusCounts.CONFIRMADO ?? orcamentos.filter(o => o.status === 'CONFIRMADO').length,
        orcamentosDevolvidos: statusCounts.DEVOLVIDO ?? orcamentos.filter(o => o.status === 'DEVOLVIDO').length,
        valorTotal: orcamentos.reduce((sum, o) => {
          const valor = parseFloat(o.valorTotalComDesconto || o.valorFinal || o.valorTotal || 0);
          return sum + valor;
        }, 0),
      };

      setStats(computedStats);
      
      // Filtrar orçamentos recentes: apenas os que têm dataFim na semana atual (domingo a sábado)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Calcular domingo da semana atual
      const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - diaSemana); // Voltar para domingo
      inicioSemana.setHours(0, 0, 0, 0);
      
      // Calcular sábado da semana atual
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6); // Adicionar 6 dias para chegar no sábado
      fimSemana.setHours(23, 59, 59, 999);
      
      const orcamentosRecentes = orcamentos
        .filter(o => {
          if (!o.dataFim) return false;
          const dataFim = new Date(o.dataFim);
          dataFim.setHours(0, 0, 0, 0);
          
          // Verificar se a dataFim está dentro da semana atual (domingo a sábado)
          return dataFim >= inicioSemana && dataFim <= fimSemana;
        })
        .sort((a, b) => {
          // Ordenar por data de criação (mais recentes primeiro)
          const dataA = new Date(a.dataCriacao || a.createdAt || 0);
          const dataB = new Date(b.dataCriacao || b.createdAt || 0);
          return dataB - dataA;
        })
        .slice(0, 10); // Limitar a 10 orçamentos
      
      setRecentOrcamentos(orcamentosRecentes);
      
      // Filtrar orçamentos com dataPagamento próxima (até 60 dias no futuro + todos vencidos)
      const limite60Dias = new Date();
      limite60Dias.setDate(hoje.getDate() + 60);
      limite60Dias.setHours(23, 59, 59, 999);
      
      const vencimentos = orcamentos
        .filter(o => {
          // Apenas orçamentos pendentes ou confirmados com data de pagamento
          if (o.status === 'CANCELADO' || o.status === 'DEVOLVIDO') return false;
          // Usar dataPagamento se disponível, caso contrário usar dataVencimento (backward compatibility)
          const dataPag = o.dataPagamento || o.dataVencimento;
          if (!dataPag) return false;
          
          const dataPagDate = new Date(dataPag);
          dataPagDate.setHours(0, 0, 0, 0);
          
          // Mostrar vencidos ou próximos 60 dias
          // Vencidos (antes de hoje) ou próximos (até 60 dias)
          return dataPagDate <= limite60Dias;
        })
        .sort((a, b) => {
          // Ordenar por data de pagamento (mais próximos/vencidos primeiro)
          // Vencidos primeiro, depois próximos
          const dataA = new Date(a.dataPagamento || a.dataVencimento);
          const dataB = new Date(b.dataPagamento || b.dataVencimento);
          dataA.setHours(0, 0, 0, 0);
          dataB.setHours(0, 0, 0, 0);
          
          const hojeComparacao = new Date();
          hojeComparacao.setHours(0, 0, 0, 0);
          
          // Se ambos são vencidos ou ambos são futuros, ordenar por data
          const aVencido = dataA < hojeComparacao;
          const bVencido = dataB < hojeComparacao;
          
          if (aVencido && !bVencido) return -1; // a vencido vem primeiro
          if (!aVencido && bVencido) return 1;  // b vencido vem primeiro
          
          // Mesmo tipo (ambos vencidos ou ambos futuros), ordenar por data
          return dataA - dataB;
        })
        .slice(0, 15); // Mostrar até 15 orçamentos
      
      setProximosVencimentos(vencimentos);

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Ações Rápidas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Ações Rápidas
                </Typography>
                <PaymentNotifications />
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/orcamentos/novo')}
                >
                  Novo Orçamento
                </Button>
                <Button
                  variant="contained"
                  startIcon={<People />}
                  onClick={() => navigate('/clientes/novo')}
                >
                  Novo Cliente
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Person />}
                  onClick={() => navigate('/colaboradores/novo')}
                >
                  Novo Colaborador
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Inventory />}
                  onClick={() => navigate('/materiais/novo')}
                >
                  Novo Material
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Próximos Vencimentos */}
      {proximosVencimentos.length > 0 && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Event color="warning" />
                  <Typography variant="h6">
                    Próximos Vencimentos (Controle de Pagamentos)
                  </Typography>
                </Box>
                <Box>
                  {proximosVencimentos.map((orcamento, index) => {
                    const dataPag = orcamento.dataPagamento || orcamento.dataVencimento;
                    const dataPagDate = new Date(dataPag);
                    dataPagDate.setHours(0, 0, 0, 0);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const diffTime = dataPagDate - hoje;
                    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const estaVencido = diasRestantes < 0;
                    const estaProximo = diasRestantes <= 7 && diasRestantes >= 0;
                    
                    return (
                      <React.Fragment key={orcamento._id}>
                        <Box
                          sx={{
                            p: 2,
                            mb: index < proximosVencimentos.length - 1 ? 2 : 0,
                            border: '1px solid',
                            borderColor: estaVencido ? 'error.main' : estaProximo ? 'warning.main' : 'divider',
                            borderWidth: estaVencido || estaProximo ? 2 : 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            backgroundColor: estaVencido ? 'error.light' : estaProximo ? 'warning.light' : 'transparent',
                            '&:hover': {
                              backgroundColor: estaVencido ? 'error.light' : estaProximo ? 'warning.light' : 'action.hover',
                            },
                          }}
                          onClick={() => navigate(`/orcamentos/${orcamento._id}`)}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={3}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Payment color={estaVencido ? 'error' : estaProximo ? 'warning' : 'primary'} />
                                <Typography variant="h6">
                                  {orcamento.numero}
                                </Typography>
                                <StatusChip status={orcamento.status} />
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {orcamento.jobName || 'Sem nome'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                Cliente
                              </Typography>
                              <Typography variant="body1">
                                {orcamento.clienteId?.nome || orcamento.clienteNome || 'Cliente não encontrado'}
                              </Typography>
                              {orcamento.clienteId?.telefone && (
                                <Typography variant="body2" color="text.secondary">
                                  {orcamento.clienteId.telefone}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Valor Total
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="primary">
                                R$ {parseFloat(orcamento.valorTotalComDesconto || orcamento.valorFinal || orcamento.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                              {orcamento.valorPago > 0 && (
                                <Typography variant="body2" color="success.main">
                                  Pago: R$ {parseFloat(orcamento.valorPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Data de Pagamento
                              </Typography>
                              <Typography 
                                variant="body1" 
                                fontWeight="bold"
                                color={estaVencido ? 'error.main' : estaProximo ? 'warning.main' : 'text.primary'}
                              >
                                {format(dataPagDate, 'dd/MM/yyyy', { locale: ptBR })}
                              </Typography>
                              <Chip
                                label={estaVencido ? `Vencido há ${Math.abs(diasRestantes)} dia(s)` : estaProximo ? `Vence em ${diasRestantes} dia(s)` : `Vence em ${diasRestantes} dias`}
                                color={estaVencido ? 'error' : estaProximo ? 'warning' : 'default'}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="body2" color="text.secondary">
                                Status Pagamento
                              </Typography>
                              <Chip
                                label={orcamento.statusPagamento === 'PAGO' ? 'Pago' : orcamento.statusPagamento === 'PARCIAL' ? 'Parcial' : 'Pendente'}
                                color={orcamento.statusPagamento === 'PAGO' ? 'success' : orcamento.statusPagamento === 'PARCIAL' ? 'info' : 'warning'}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        {index < proximosVencimentos.length - 1 && (
                          <Divider sx={{ my: 2 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Orçamentos Recentes */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orçamentos Recentes
              </Typography>
              <Box>
                {recentOrcamentos.map((orcamento, index) => (
                  <React.Fragment key={orcamento._id}>
                    <Box
                      sx={{
                        p: 2,
                        mb: index < recentOrcamentos.length - 1 ? 2 : 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate(`/orcamentos/${orcamento._id}`)}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Receipt color="primary" />
                            <Typography variant="h6">
                              {orcamento.numero}
                            </Typography>
                            <StatusChip status={orcamento.status} />
                          </Box>
                          <Typography variant="body1" fontWeight="medium">
                            {orcamento.jobName || 'Sem nome'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Cliente
                          </Typography>
                          <Typography variant="body1">
                            {orcamento.clienteId?.nome || orcamento.clienteNome || 'Cliente não encontrado'}
                          </Typography>
                          {orcamento.clienteId?.telefone && (
                            <Typography variant="body2" color="text.secondary">
                              {orcamento.clienteId.telefone}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            Valor Total
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="primary">
                            R$ {parseFloat(orcamento.valorTotalComDesconto || orcamento.valorFinal || orcamento.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            Data de Criação
                          </Typography>
                          <Typography variant="body1">
                            {orcamento.dataCriacao || orcamento.createdAt
                              ? format(new Date(orcamento.dataCriacao || orcamento.createdAt), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          {orcamento.dataInicio && (
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Data Início
                              </Typography>
                              <Typography variant="body1">
                                {format(new Date(orcamento.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                              </Typography>
                            </>
                          )}
                          {orcamento.dataFim && (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Data Fim
                              </Typography>
                              <Typography variant="body1">
                                {format(new Date(orcamento.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    {index < recentOrcamentos.length - 1 && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total de Orçamentos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalOrcamentos}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pendentes
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.orcamentosPendentes}
                  </Typography>
                </Box>
                <Pending sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Confirmados
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.orcamentosConfirmados}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Devolvidos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.orcamentosDevolvidos}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Funcionalidades do Sistema */}
      {shouldShowFeaturesPanel && systemStatus?.features?.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Funcionalidades Disponíveis
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {systemStatus.features.map((feature, index) => (
                <Chip key={index} label={feature} variant="outlined" />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;

