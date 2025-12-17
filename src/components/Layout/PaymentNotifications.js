import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orcamentoService } from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PaymentNotifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  useEffect(() => {
    loadProximosPagamentos();
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadProximosPagamentos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadProximosPagamentos = async () => {
    try {
      setLoading(true);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Calcular início e fim do mês atual
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      fimMes.setHours(23, 59, 59, 999);

      // Buscar todos os orçamentos
      const response = await orcamentoService.getAll({ limit: 1000 });
      const todosOrcamentos = response.data.data || [];

      // Filtrar orçamentos com dataPagamento no mês atual
      const pagamentosMes = todosOrcamentos
        .filter(o => {
          // Apenas orçamentos confirmados ou pendentes
          if (o.status === 'CANCELADO' || o.status === 'DEVOLVIDO') return false;
          
          // Usar dataPagamento se disponível, caso contrário dataVencimento (backward compatibility)
          const dataPag = o.dataPagamento || o.dataVencimento;
          if (!dataPag) return false;
          
          const dataPagDate = new Date(dataPag);
          dataPagDate.setHours(0, 0, 0, 0);
          
          // Verificar se está dentro do mês atual
          return dataPagDate >= inicioMes && dataPagDate <= fimMes;
        })
        .sort((a, b) => {
          // Ordenar por data de pagamento (mais próximos primeiro)
          const dataA = new Date(a.dataPagamento || a.dataVencimento);
          const dataB = new Date(b.dataPagamento || b.dataVencimento);
          return dataA - dataB;
        });

      setOrcamentos(pagamentosMes);
    } catch (error) {
      console.error('Erro ao carregar próximos pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    loadProximosPagamentos(); // Atualizar ao abrir
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOrcamentoClick = (orcamentoId) => {
    handleClose();
    navigate(`/orcamentos/${orcamentoId}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 'auto' }}
      >
        <Badge badgeContent={orcamentos.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 400,
            maxWidth: 500,
            maxHeight: 600,
            overflow: 'auto',
          },
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Próximos Pagamentos do Mês
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {orcamentos.length === 0 
              ? 'Nenhum pagamento previsto para este mês'
              : `${orcamentos.length} pagamento(s) previsto(s)`
            }
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : orcamentos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Nenhum pagamento encontrado
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {orcamentos.map((orcamento, index) => {
                const dataPag = orcamento.dataPagamento || orcamento.dataVencimento;
                const dataPagDate = new Date(dataPag);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const estaVencido = dataPagDate < hoje;
                const estaHoje = dataPagDate.getTime() === hoje.getTime();
                
                return (
                  <React.Fragment key={orcamento._id}>
                    <ListItem
                      button
                      onClick={() => handleOrcamentoClick(orcamento._id)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        backgroundColor: estaVencido ? 'error.light' : estaHoje ? 'warning.light' : 'transparent',
                        borderLeft: estaVencido ? '4px solid' : estaHoje ? '4px solid' : 'none',
                        borderColor: estaVencido ? 'error.main' : estaHoje ? 'warning.main' : 'transparent',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight="medium">
                              {orcamento.jobName || 'Sem nome'}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={estaVencido ? 'error.main' : estaHoje ? 'warning.main' : 'primary.main'}
                            >
                              {formatCurrency(orcamento.valorTotalComDesconto || orcamento.valorFinal || orcamento.valorTotal || 0)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              {format(dataPagDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </Typography>
                            {estaVencido && (
                              <Typography variant="caption" color="error.main">
                                Vencido
                              </Typography>
                            )}
                            {estaHoje && (
                              <Typography variant="caption" color="warning.main">
                                Vence hoje
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < orcamentos.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Menu>
    </>
  );
};

export default PaymentNotifications;


