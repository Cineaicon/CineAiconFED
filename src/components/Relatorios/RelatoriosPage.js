import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Stack,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TablePagination,
} from '@mui/material';
import { PictureAsPdf, Payment as PaymentIcon, Search } from '@mui/icons-material';
import { orcamentoService } from '../../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

const RelatoriosPage = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orcamentos, setOrcamentos] = useState([]);
  const [filteredOrcamentos, setFilteredOrcamentos] = useState([]);
  const [summary, setSummary] = useState({ total: 0, totalValorPago: 0, totalValorFinal: 0 });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentDialog, setPaymentDialog] = useState({ open: false, orcamento: null, valor: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const applyFilter = (list, term) => {
    if (!term) return list;
    const lower = term.toLowerCase();
    return list.filter((orc) => {
      const clienteNome = (orc.clienteNome || orc.clienteId?.nome || '').toLowerCase();
      const jobName = (orc.jobName || '').toLowerCase();
      return jobName.includes(lower) || clienteNome.includes(lower);
    });
  };

  const updateSummary = (orcamentosList) => {
    const totalValorPago = orcamentosList.reduce((acc, item) => acc + (item.valorPago || 0), 0);
    const totalValorFinal = orcamentosList.reduce((acc, item) => acc + (item.valorFinal || 0), 0);
    setSummary({
      total: orcamentosList.length,
      totalValorPago,
      totalValorFinal,
    });
  };

  const fetchReport = async (monthValue) => {
      if (!monthValue) {
        setOrcamentos([]);
        updateSummary([]);
        return;
      }

    try {
      setLoading(true);
      setError(null);
      setDownloadError(null);

      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      // Buscar orçamentos confirmados e devolvidos (não incluir pendentes ou cancelados)
      const response = await orcamentoService.getAll({
        status: 'CONFIRMADO,DEVOLVIDO', // Passar múltiplos status separados por vírgula
        dataInicio: startDate.toISOString(),
        dataFim: endDate.toISOString(),
        limit: 1000,
        page: 1,
        sort: '-dataCriacao',
      });

      const registros = response?.data?.data || [];

      setOrcamentos(registros);
      setFilteredOrcamentos(applyFilter(registros, searchTerm));
      updateSummary(registros);
      setPage(0);
    } catch (err) {
      console.error('Erro ao carregar relatório de orçamentos confirmados:', err);
      setError('Não foi possível carregar o relatório. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateReport = () => {
    fetchReport(selectedMonth);
  };

  const handleSearchChange = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    setPage(0);
    setFilteredOrcamentos(applyFilter(orcamentos, term));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenPaymentDialog = (orcamento) => {
    setPaymentDialog({
      open: true,
      orcamento,
      valor: (orcamento.valorPago || 0).toString(),
    });
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialog({ open: false, orcamento: null, valor: '' });
  };

  const handleRegisterPayment = async () => {
    const { orcamento, valor } = paymentDialog;
    if (!orcamento) return;

    try {
      setSaving(true);
      const valorPago = parseFloat(valor) || 0;
      
      // Atualizar orçamento no backend
      await orcamentoService.update(orcamento._id, {
        valorPago: valorPago,
        // Atualizar status de pagamento baseado no valor
        statusPagamento: valorPago >= (orcamento.valorFinal || 0) ? 'PAGO' : valorPago > 0 ? 'PARCIAL' : 'PENDENTE',
      });

      // Atualizar lista local
      const updatedOrcamentos = orcamentos.map((o) =>
        o._id === orcamento._id
          ? { ...o, valorPago, statusPagamento: valorPago >= (o.valorFinal || 0) ? 'PAGO' : valorPago > 0 ? 'PARCIAL' : 'PENDENTE' }
          : o
      );
      
      setOrcamentos(updatedOrcamentos);
      updateSummary(updatedOrcamentos);
      handleClosePaymentDialog();
      
      setSnackbar({
        open: true,
        message: 'Pagamento registrado com sucesso!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao registrar pagamento: ' + (err.response?.data?.message || err.message),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedMonth || downloading || loading) {
      return;
    }

    try {
      setDownloading(true);
      setDownloadError(null);

      const response = await orcamentoService.downloadConfirmedReportPdf({ periodo: selectedMonth });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const [year, month] = selectedMonth.split('-');
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-orcamentos-confirmados-${year}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar PDF do relatório:', err);
      setDownloadError('Não foi possível gerar o PDF. Tente novamente em instantes.');
    } finally {
      setDownloading(false);
    }
  };

  const currentPageOrcamentos = filteredOrcamentos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Consulte os orçamentos confirmados e devolvidos por mês. Cada linha representa um orçamento com os
        principais dados financeiros. Apenas orçamentos já confirmados são exibidos.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Mês de referência"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={!selectedMonth || loading}
            >
              Gerar relatório
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadPdf}
              disabled={!selectedMonth || downloading || loading}
            >
              {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {downloadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {downloadError}
        </Alert>
      )}

      {loading && (
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <CircularProgress size={24} />
          <Typography>Carregando relatório...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Orçamentos (Confirmados + Devolvidos)
                  </Typography>
                  <Typography variant="h5">{summary.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Valor pago no mês
                  </Typography>
                  <Typography variant="h5">{formatCurrency(summary.totalValorPago)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Valor final dos orçamentos
                  </Typography>
                  <Typography variant="h5">{formatCurrency(summary.totalValorFinal)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Busca */}
          <Box mb={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por job ou nome do cliente..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>

          {filteredOrcamentos.length === 0 ? (
            <Alert severity="info">Nenhum orçamento confirmado ou devolvido encontrado para o período selecionado.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Data de Aprovação</TableCell>
                    <TableCell>Valor Final</TableCell>
                    <TableCell>Valor Pago</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPageOrcamentos.map((orcamento) => (
                    <TableRow key={orcamento._id} hover>
                      <TableCell>{orcamento.numero}</TableCell>
                      <TableCell>
                        {orcamento.clienteId?.nome || orcamento.clienteNome || '—'}
                      </TableCell>
                      <TableCell>{orcamento.jobName}</TableCell>
                      <TableCell>
                        {orcamento.dataAprovacao
                          ? new Date(orcamento.dataAprovacao).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell>{formatCurrency(orcamento.valorFinal)}</TableCell>
                      <TableCell>{formatCurrency(orcamento.valorPago || 0)}</TableCell>
                      <TableCell align="center">
                        {orcamento.statusPagamento === 'PAGO' && (
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            Pago
                          </Typography>
                        )}
                        {orcamento.statusPagamento === 'PARCIAL' && (
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            Parcial
                          </Typography>
                        )}
                        {(!orcamento.statusPagamento || orcamento.statusPagamento === 'PENDENTE') && (
                          <Typography variant="body2" color="text.secondary">
                            Pendente
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleOpenPaymentDialog(orcamento)}
                          disabled={saving}
                        >
                          Registrar Pagamento
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog para registrar pagamento */}
      <Dialog open={paymentDialog.open} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pagamento</DialogTitle>
        <DialogContent>
          {paymentDialog.orcamento && (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                <strong>Orçamento:</strong> {paymentDialog.orcamento.numero}
                <br />
                <strong>Cliente:</strong> {paymentDialog.orcamento.clienteId?.nome || paymentDialog.orcamento.clienteNome || '—'}
                <br />
                <strong>Job:</strong> {paymentDialog.orcamento.jobName}
                <br />
                <strong>Valor Final:</strong> {formatCurrency(paymentDialog.orcamento.valorFinal || 0)}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Valor Pago"
                type="number"
                fullWidth
                variant="outlined"
                value={paymentDialog.valor}
                onChange={(e) => setPaymentDialog({ ...paymentDialog, valor: e.target.value })}
                inputProps={{ 
                  min: 0, 
                  step: '0.01',
                }}
                helperText={`Valor pendente: ${formatCurrency((paymentDialog.orcamento.valorFinal || 0) - (parseFloat(paymentDialog.valor) || 0))}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRegisterPayment} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {saving ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
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
    </Box>
  );
};

export default RelatoriosPage;
