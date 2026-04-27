import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Add, Delete, ArrowBack, PictureAsPdf, Edit, Save, Close } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { orcamentoService, materialService } from '../../services/api';

const parseNum = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatBRL = (v) =>
  `R$ ${parseNum(v).toFixed(2).replace('.', ',')}`;

const EXTRA_VAZIO = {
  materialId: null,
  categoria: '',
  equipamento: '',
  quantidade: 1,
  dias: 1,
  custoDiario: '',
  descontoPercentual: 0,
};

const ExtraFormCard = ({ materiais, onSave, onCancel, initial }) => {
  const [form, setForm] = useState(initial || EXTRA_VAZIO);
  const [matSelecionado, setMatSelecionado] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial?.materialId && materiais.length) {
      const mat = materiais.find(
        (m) => m._id === (initial.materialId?._id || initial.materialId)
      );
      setMatSelecionado(mat || null);
    }
  }, [initial, materiais]);

  const bruto =
    parseNum(form.quantidade) * parseNum(form.dias) * parseNum(form.custoDiario);
  const desc = parseNum(form.descontoPercentual);
  const total = Math.max(0, bruto - (desc > 0 ? (bruto * desc) / 100 : 0));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 2, borderColor: 'primary.main', borderWidth: 2 }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Autocomplete de material — linha inteira */}
        <Grid item xs={12}>
          <Autocomplete
            options={materiais}
            value={matSelecionado}
            getOptionLabel={(op) =>
              op ? `${op.equipamento} — ${formatBRL(op.custoDiario)}` : ''
            }
            filterOptions={(options, { inputValue }) => {
              const term = (inputValue || '').toLowerCase();
              if (!term) return [];
              return options.filter(
                (op) =>
                  (op.equipamento || '').toLowerCase().includes(term) ||
                  (op.categoria || '').toLowerCase().includes(term)
              );
            }}
            onChange={(_, newVal) => {
              setMatSelecionado(newVal);
              if (newVal) {
                setForm((prev) => ({
                  ...prev,
                  materialId: newVal._id,
                  categoria: newVal.categoria || '',
                  equipamento: newVal.equipamento || '',
                  custoDiario: parseNum(newVal.custoDiario),
                }));
              } else {
                setForm((prev) => ({
                  ...prev,
                  materialId: null,
                  categoria: '',
                  equipamento: '',
                  custoDiario: '',
                }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Material / Equipamento"
                placeholder="Digite para buscar por nome ou categoria..."
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {option.equipamento}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.categoria} · {formatBRL(option.custoDiario)}/dia
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText="Digite para buscar materiais..."
            isOptionEqualToValue={(op, val) => op._id === (val?._id || val)}
          />
        </Grid>

        {/* Campos numéricos */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Quantidade"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Dias"
            value={form.dias}
            onChange={(e) => setForm({ ...form, dias: e.target.value })}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Custo/Dia (R$)"
            value={form.custoDiario}
            onChange={(e) => setForm({ ...form, custoDiario: e.target.value })}
            inputProps={{ min: 0, step: '0.01' }}
            helperText="Auto-preenchido pelo material"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Desconto (%)"
            value={form.descontoPercentual}
            onChange={(e) => setForm({ ...form, descontoPercentual: e.target.value })}
            inputProps={{ min: 0, max: 100, step: '0.01' }}
          />
        </Grid>

        {/* Preview total + ações */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box display="flex" gap={1} flexWrap="wrap">
              {form.categoria && (
                <Chip label={`Categoria: ${form.categoria}`} size="small" variant="outlined" />
              )}
              {form.custoDiario !== '' && (
                <Chip
                  label={`Total: ${formatBRL(total)}`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" size="small" startIcon={<Close />} onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={saving ? <CircularProgress size={14} /> : <Save />}
                onClick={handleSave}
                disabled={saving || !form.equipamento}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

const OrcamentoExtras = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orcamento, setOrcamento] = useState(null);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orcamentoService.getById(id);
      setOrcamento(res.data);
    } catch {
      setError('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
    materialService.getAll().then((r) => setMateriais(r.data || [])).catch(() => {});
  }, [carregar]);

  const handleAdicionar = async (form) => {
    try {
      await orcamentoService.addExtra(id, form);
      await carregar();
      setAdicionando(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar extra');
    }
  };

  const handleEditar = async (extraId, form) => {
    try {
      await orcamentoService.updateExtra(id, extraId, form);
      await carregar();
      setEditandoId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao editar extra');
    }
  };

  const handleRemover = async (extraId) => {
    try {
      await orcamentoService.removeExtra(id, extraId);
      await carregar();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao remover extra');
    }
  };

  const handleGerarPDF = async () => {
    try {
      setPdfLoading(true);
      const response = await orcamentoService.generatePDF(id, 'extras');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extras-${orcamento.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erro ao gerar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const extras = orcamento?.extras || [];
  const totalGeral = extras.reduce((acc, ex) => {
    const bruto = parseNum(ex.quantidade) * parseNum(ex.dias) * parseNum(ex.custoDiario);
    const desc = parseNum(ex.descontoPercentual);
    return acc + Math.max(0, bruto - (desc > 0 ? (bruto * desc) / 100 : 0));
  }, 0);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/orcamentos/${id}`)}
            sx={{ mb: 1 }}
          >
            Voltar ao Orçamento
          </Button>
          <Typography variant="h5" fontWeight={600}>
            Extras — {orcamento?.numero} {orcamento?.jobName && `· ${orcamento.jobName}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {extras.length} {extras.length === 1 ? 'item' : 'itens'} · Total:{' '}
            <strong>{formatBRL(totalGeral)}</strong>
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={pdfLoading ? <CircularProgress size={16} /> : <PictureAsPdf />}
            onClick={handleGerarPDF}
            disabled={pdfLoading || extras.length === 0}
            color="secondary"
          >
            PDF Extras
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setAdicionando(true); setEditandoId(null); }}
            disabled={adicionando}
          >
            Incluir Extra
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form de novo extra */}
      {adicionando && (
        <Box mb={2}>
          <ExtraFormCard
            materiais={materiais}
            onSave={handleAdicionar}
            onCancel={() => setAdicionando(false)}
          />
        </Box>
      )}

      {/* Lista de extras */}
      {extras.length === 0 && !adicionando ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum extra adicionado
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Clique em "Incluir Extra" para adicionar itens extras ao orçamento.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAdicionando(true)}>
              Incluir Extra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {extras.map((extra, idx) => {
            const bruto =
              parseNum(extra.quantidade) * parseNum(extra.dias) * parseNum(extra.custoDiario);
            const desc = parseNum(extra.descontoPercentual);
            const total = Math.max(0, bruto - (desc > 0 ? (bruto * desc) / 100 : 0));

            if (editandoId === extra._id) {
              return (
                <ExtraFormCard
                  key={extra._id}
                  materiais={materiais}
                  initial={extra}
                  onSave={(form) => handleEditar(extra._id, form)}
                  onCancel={() => setEditandoId(null)}
                />
              );
            }

            return (
              <Paper key={extra._id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        #{idx + 1}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {extra.equipamento || '-'}
                      </Typography>
                      {extra.categoria && (
                        <Chip label={extra.categoria} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {extra.quantidade} un. × {extra.dias} {extra.dias === 1 ? 'dia' : 'dias'} × {formatBRL(extra.custoDiario)}/dia
                      {extra.descontoPercentual > 0 && (
                        <span style={{ color: '#2e7d32', marginLeft: 8 }}>
                          · Desconto {extra.descontoPercentual}%
                        </span>
                      )}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={formatBRL(total)} color="primary" size="small" />
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => { setEditandoId(extra._id); setAdicionando(false); }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton size="small" color="error" onClick={() => handleRemover(extra._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Rodapé com total */}
      {extras.length > 0 && (
        <Box mt={3}>
          <Divider />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Box
              p={2}
              bgcolor="primary.main"
              color="white"
              borderRadius={2}
              textAlign="center"
              minWidth={180}
            >
              <Typography variant="body2">Total dos Extras</Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatBRL(totalGeral)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OrcamentoExtras;
