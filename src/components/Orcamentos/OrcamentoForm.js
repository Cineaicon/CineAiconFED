import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Stack,
  FormHelperText,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Cancel,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { orcamentoService, clienteService, colaboradorService, materialService } from '../../services/api';

const steps = ['Informações Básicas', 'Itens do Orçamento', 'Descontos e Totais', 'Revisão'];

const parseNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseNumber(value, 0));

const OrcamentoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      jobName: '',
      clienteId: '',
      colaboradorId: '',
      produtor: '',
      diretor: '',
      eletricista: '',
      dirFotografia: '',
      maquinista: '',
      dataInicio: '',
      dataFim: '',
      dataPagamento: '',
      descontoGeral: 0,
      descontoValorGeral: 0,
      agruparPorCategoria: true,
      itens: [],
    }
  });

  const { fields, append, remove, swap, replace } = useFieldArray({
    control,
    name: 'itens'
  });

  const watchedFields = watch();
  const watchedItems = useMemo(() => watchedFields.itens || [], [watchedFields.itens]);
  const watchedDescontoGeral = watch('descontoGeral');
  const watchedDescontoValorGeral = watch('descontoValorGeral');
  const agruparPorCategoria = Boolean(watchedFields.agruparPorCategoria);
  const isReorderingRef = useRef(false);
  const lastGroupedOrderRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [, setCalcKey] = useState(0); // Forçar recálculo quando necessário (calcKey não usado diretamente)
  const itemRefs = useRef({}); // Refs para os cards de itens
  const lastItemIndexRef = useRef(-1); // Rastrear último índice para scroll
  const [materialInputValues, setMaterialInputValues] = useState({}); // Controlar texto digitado em cada campo de material
  const [materialFocusStates, setMaterialFocusStates] = useState({}); // Controlar foco de cada campo de material
  
  // Watch todos os campos que afetam o cálculo para atualização em tempo real
  watch(['itens', 'descontoGeral', 'descontoValorGeral']);
  
  // Usar um efeito para garantir que os cálculos sejam atualizados quando campos específicos mudarem
  // Isso é necessário porque o React Hook Form pode não disparar atualizações do array quando campos internos mudam
  const itemsHashRef = useRef('');
  useEffect(() => {
    // Criar uma string de hash dos valores dos itens para detectar mudanças reais
    const itemsHash = JSON.stringify(watchedItems.map(item => ({
      materialId: item?.materialId,
      quantidade: item?.quantidade,
      dias: item?.dias,
      valorUnitario: item?.valorUnitario,
      descontoPercentual: item?.descontoPercentual,
      descontoValor: item?.descontoValor,
    })));
    
    // Só atualizar se o hash mudou (valores realmente diferentes)
    if (itemsHashRef.current !== itemsHash) {
      itemsHashRef.current = itemsHash;
      // Forçar atualização dos cálculos quando itens ou descontos mudarem
      // Usar requestAnimationFrame para garantir que o React Hook Form já atualizou os valores
      requestAnimationFrame(() => {
        setCalcKey(prev => prev + 1);
      });
    }
  }, [watchedItems, watchedDescontoGeral, watchedDescontoValorGeral]);

  const loadInitialData = async () => {
    try {
      const [clientesRes, colaboradoresRes, materiaisRes] = await Promise.all([
        clienteService.getAll(),
        colaboradorService.getAll(),
        materialService.getAll(),
      ]);

      setClientes(clientesRes.data);
      setColaboradores(colaboradoresRes.data);
      setMateriais(materiaisRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
      setError('Erro ao carregar dados iniciais');
    }
  };

  const loadOrcamento = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orcamentoService.getById(id);
      const orcamento = response.data;
      
      // Função auxiliar para formatar data para input type="date" (YYYY-MM-DD)
      const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        try {
          // Se já está no formato YYYY-MM-DD, retorna direto
          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
          }
          // Se é uma data ISO ou outro formato, converte
          // Usar UTC para evitar problemas de timezone
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '';
          // Usar UTC para manter o dia exato
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return '';
        }
      };
      
      // Limpar todos os itens antes de carregar novos (evitar duplicação)
      replace([]);
      
      // Preencher todos os campos do formulário
      setValue('jobName', orcamento.jobName || '');
      setValue('clienteId', orcamento.clienteId?._id || orcamento.clienteId || '');
      setValue('colaboradorId', orcamento.colaboradorId?._id || orcamento.colaboradorId || '');
      setValue('produtor', orcamento.produtor || '');
      setValue('diretor', orcamento.diretor || '');
      setValue('eletricista', orcamento.eletricista || '');
      setValue('dirFotografia', orcamento.dirFotografia || '');
      setValue('maquinista', orcamento.maquinista || '');
      setValue('dataInicio', formatDateForInput(orcamento.dataInicio));
      setValue('dataFim', formatDateForInput(orcamento.dataFim));
      setValue('descontoGeral', orcamento.descontoGeral || 0);
      setValue('descontoValorGeral', orcamento.descontoValorGeral || 0);
      setValue('agruparPorCategoria', orcamento.agruparPorCategoria !== undefined ? orcamento.agruparPorCategoria : true);
      
      // Preparar itens para substituição (ordena por posição)
      const itensOrdenados = [...(orcamento.itens || [])].sort((a, b) => (a.posicao || 0) - (b.posicao || 0));
      const itensFormatados = itensOrdenados.map((item, index) => ({
        materialId: item.materialId?._id || item.materialId,
        quantidade: item.quantidade,
        dias: item.dias,
        valorUnitario: item.valorUnitario || item.custoDiario,
        descontoPercentual: item.descontoPercentual || 0,
        descontoValor: item.descontoValor || 0,
        posicao: item.posicao !== undefined ? item.posicao : index,
      }));
      
      // Substituir todos os itens de uma vez para evitar duplicação
      replace(itensFormatados);
      
      // Resetar referências de agrupamento
      isReorderingRef.current = false;
      lastGroupedOrderRef.current = null;
    } catch (err) {
      console.error('Erro ao carregar orçamento:', err);
      setError('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  }, [id, replace, setValue]);

  useEffect(() => {
    loadInitialData();
    if (id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadOrcamento();
    } else if (!id) {
      hasLoadedRef.current = false;
    }
  }, [id, loadOrcamento]);

  // Resetar referências quando o agrupamento é desativado
  useEffect(() => {
    if (!agruparPorCategoria) {
      isReorderingRef.current = false;
      lastGroupedOrderRef.current = null;
    }
  }, [agruparPorCategoria]);

  const addItem = () => {
    const newIndex = fields.length;
    append({
      materialId: '',
      quantidade: 1,
      dias: 1,
      valorUnitario: 0,
      descontoPercentual: 0,
      descontoValor: 0,
      posicao: newIndex, // Posição baseada no índice atual
    });
    // Marcar o novo índice para scroll
    lastItemIndexRef.current = newIndex;
    // Forçar atualização dos cálculos após adicionar item
    requestAnimationFrame(() => {
      setCalcKey(prev => prev + 1);
    });
  };
  
  // Efeito para fazer scroll para o último item adicionado
  useEffect(() => {
    if (lastItemIndexRef.current >= 0) {
      // Aguardar o próximo frame para garantir que o DOM foi atualizado
      // Usar um timeout maior para garantir que o agrupamento (se ativo) já processou
      const scrollTimeout = setTimeout(() => {
        const targetIndex = lastItemIndexRef.current;
        const element = itemRefs.current[targetIndex];
        
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
        // Resetar após o scroll
        lastItemIndexRef.current = -1;
      }, 150);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [fields.length, agruparPorCategoria]);

  const removeItem = (index) => {
    remove(index);
    // Limpar o estado do input do material removido
    setMaterialInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[index];
      // Reindexar os valores se necessário
      const reindexed = {};
      Object.keys(newValues).forEach(key => {
        const keyNum = parseInt(key, 10);
        if (keyNum > index) {
          reindexed[keyNum - 1] = newValues[key];
        } else if (keyNum < index) {
          reindexed[key] = newValues[key];
        }
      });
      return reindexed;
    });
    // Forçar atualização dos cálculos após remover item
    requestAnimationFrame(() => {
      setCalcKey(prev => prev + 1);
    });
  };

  // Função para aplicar dias do primeiro item em todos os itens abaixo
  const applyDiasToAll = () => {
    if (fields.length === 0) return;
    const primeiroItem = watchedItems[0];
    const diasValue = parseNumber(primeiroItem?.dias, 1);
    if (diasValue > 0) {
      // Aplicar em todos os itens, começando do segundo (índice 1)
      for (let index = 1; index < fields.length; index++) {
        setValue(`itens.${index}.dias`, diasValue, { shouldDirty: true, shouldValidate: true });
      }
      // Forçar atualização dos cálculos
      requestAnimationFrame(() => {
        setCalcKey(prev => prev + 1);
      });
    }
  };

  // Função para aplicar desconto percentual do primeiro item em todos os itens abaixo
  const applyDescontoPercentualToAll = () => {
    if (fields.length === 0) return;
    const primeiroItem = watchedItems[0];
    const descontoValue = parseNumber(primeiroItem?.descontoPercentual, 0);
    if (descontoValue >= 0) {
      // Aplicar em todos os itens, começando do segundo (índice 1)
      for (let index = 1; index < fields.length; index++) {
        // Limpar desconto em valor quando usar percentual
        setValue(`itens.${index}.descontoValor`, 0, { shouldDirty: true });
        setValue(`itens.${index}.descontoPercentual`, descontoValue, { shouldDirty: true, shouldValidate: true });
      }
      // Forçar atualização dos cálculos
      requestAnimationFrame(() => {
        setCalcKey(prev => prev + 1);
      });
    }
  };

  // Função para aplicar desconto em valor do primeiro item em todos os itens abaixo
  const applyDescontoValorToAll = () => {
    if (fields.length === 0) return;
    const primeiroItem = watchedItems[0];
    const descontoValue = parseNumber(primeiroItem?.descontoValor, 0);
    if (descontoValue >= 0) {
      // Aplicar em todos os itens, começando do segundo (índice 1)
      for (let index = 1; index < fields.length; index++) {
        // Limpar desconto percentual quando usar valor
        setValue(`itens.${index}.descontoPercentual`, 0, { shouldDirty: true });
        setValue(`itens.${index}.descontoValor`, descontoValue, { shouldDirty: true, shouldValidate: true });
      }
      // Forçar atualização dos cálculos
      requestAnimationFrame(() => {
        setCalcKey(prev => prev + 1);
      });
    }
  };

  const moveItemUp = (index) => {
    if (index > 0) {
      swap(index, index - 1);
      // Atualizar posições
      const currentValue = fields.map((_, i) => watchedItems[i]);
      currentValue.forEach((item, i) => {
        setValue(`itens.${i}.posicao`, i);
      });
    }
  };

  const moveItemDown = (index) => {
    if (index < fields.length - 1) {
      swap(index, index + 1);
      // Atualizar posições
      const currentValue = fields.map((_, i) => watchedItems[i]);
      currentValue.forEach((item, i) => {
        setValue(`itens.${i}.posicao`, i);
      });
    }
  };

  const getMaterialById = useCallback((materialId) => {
    return materiais.find(m => m._id === materialId);
  }, [materiais]);

  const calculateItemTotal = useCallback((item) => {
    if (!item) return 0;

    const material = getMaterialById(item.materialId);
    const valorUnitario = parseNumber(material?.custoDiario ?? item.valorUnitario, 0);
    const quantidade = parseNumber(item.quantidade || 0, 0);
    const dias = parseNumber(item.dias || 0, 0);

    // Calcular subtotal com precisão
    const subtotal = Number((quantidade * dias * valorUnitario).toFixed(2));

    // Calcular desconto (percentual tem prioridade sobre valor)
    const descontoPercentual = parseNumber(item.descontoPercentual || 0, 0);
    const descontoValor = parseNumber(item.descontoValor || 0, 0);
    const desconto = descontoPercentual > 0 
      ? Number((subtotal * descontoPercentual / 100).toFixed(2))
      : descontoValor;

    // Retornar valor final com precisão
    return Number(Math.max(subtotal - desconto, 0).toFixed(2));
  }, [getMaterialById]);

  const calculateTotal = () => {
    const subtotal = fields.reduce((sum, field, index) => {
      const item = watchedItems[index];
      return sum + calculateItemTotal(item);
    }, 0);

    const descontoPercentual = parseNumber(watchedFields.descontoGeral, 0);
    const descontoValor = parseNumber(watchedFields.descontoValorGeral, 0);
    const descontoGeral = descontoPercentual > 0 ? (subtotal * descontoPercentual) / 100 : descontoValor;

    return Math.max(subtotal - descontoGeral, 0);
  };

  const persistOrder = async () => {
    if (!id) return;

    try {
      const payload = (watchedItems || []).map((item, index) => ({
        itemId: item._id || item.id || item.materialId || index,
        posicao: index,
      }));

      await orcamentoService.reorderItems(id, payload);
    } catch (err) {
      console.error('Erro ao salvar ordenação:', err);
      setError('Não foi possível salvar a nova ordem dos itens.');
    }
  };

  // Calcular subtotal dos itens em tempo real - sempre recalcula quando calcKey muda
  const subtotalItens = useMemo(() => {
    const total = watchedItems.reduce((sum, item) => {
      if (!item) return sum;
      return sum + calculateItemTotal(item);
    }, 0);
    return Number(total.toFixed(2));
  }, [watchedItems, calculateItemTotal]);

  // Calcular total com desconto geral em tempo real
  const totalComDesconto = useMemo(() => {
    const descontoPercentual = parseNumber(watchedDescontoGeral || 0, 0);
    const descontoValor = parseNumber(watchedDescontoValorGeral || 0, 0);
    const descontoGeral = descontoPercentual > 0 
      ? Number((subtotalItens * descontoPercentual / 100).toFixed(2))
      : descontoValor;
    return Number(Math.max(subtotalItens - descontoGeral, 0).toFixed(2));
  }, [subtotalItens, watchedDescontoGeral, watchedDescontoValorGeral]);

  const groupedItems = useMemo(() => {
    if (!agruparPorCategoria) {
      return [];
    }

    const groups = new Map();
    fields.forEach((field, index) => {
      const item = watchedItems[index] || {};
      const material = getMaterialById(item.materialId);
      const categoria = material?.categoria || item.categoria || 'Sem categoria';
      if (!groups.has(categoria)) {
        groups.set(categoria, []);
      }
      groups.get(categoria).push(index);
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [fields, watchedItems, agruparPorCategoria, getMaterialById]);

  useEffect(() => {
    if (!agruparPorCategoria || groupedItems.length === 0 || isReorderingRef.current || fields.length === 0) {
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const nextOrderIndexes = groupedItems.flatMap(([, indexes]) => indexes);
    if (nextOrderIndexes.length !== fields.length) {
      return;
    }

    // Verificar se há índices duplicados (isso indicaria um problema)
    const uniqueIndexes = new Set(nextOrderIndexes);
    if (uniqueIndexes.size !== nextOrderIndexes.length) {
      console.error('Índices duplicados detectados no agrupamento!', nextOrderIndexes);
      return;
    }

    // Criar uma string para comparar a ordem atual com a última ordem conhecida
    const currentOrderString = JSON.stringify(nextOrderIndexes);
    if (lastGroupedOrderRef.current === currentOrderString) {
      return; // Já está na ordem correta, não precisa reordenar
    }

    const currentOrder = fields.map((_, index) => index);
    const hasChanges = nextOrderIndexes.some((newIndex, position) => newIndex !== currentOrder[position]);

    if (!hasChanges) {
      lastGroupedOrderRef.current = currentOrderString;
      return;
    }

    // Marcar que estamos reordenando para evitar loops
    isReorderingRef.current = true;

    // Usar uma abordagem mais segura: criar nova ordem e substituir
    const reorderedItems = nextOrderIndexes
      .map(originalIndex => watchedItems[originalIndex])
      .filter(item => item !== undefined && item !== null); // Apenas remover itens undefined/null
    
    if (reorderedItems.length === fields.length && reorderedItems.length > 0) {
      // Substituir todos os itens de uma vez com a nova ordem
      replace(reorderedItems);
      
      // Atualizar posições
      setTimeout(() => {
        reorderedItems.forEach((item, position) => {
          if (item) {
            setValue(`itens.${position}.posicao`, position, { shouldDirty: false, shouldValidate: false });
          }
        });
      }, 50);
    }

    // Salvar a ordem atual e liberar o flag após um pequeno delay
    lastGroupedOrderRef.current = currentOrderString;
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agruparPorCategoria, groupedItems, fields.length, replace, setValue, watchedItems]);

  const getGroupTotal = (indexes) => {
    const total = indexes.reduce((sum, index) => {
      const item = watchedItems[index];
      if (!item) return sum;
      return sum + calculateItemTotal(item);
    }, 0);
    return Number(total.toFixed(2));
  };

  const renderItemCard = (index) => {
    const field = fields[index];
    if (!field) return null;

    const item = watchedItems[index] || {};
    const material =
      getMaterialById(item.materialId) ||
      (item.materialId
        ? {
            _id: item.materialId,
            categoria: item.categoria || 'Sem categoria',
            equipamento: item.equipamento || 'Item personalizado',
            custoDiario: item.valorUnitario || 0,
          }
        : null);

    const categoria = material?.categoria || 'Sem categoria';
    const equipamento = material?.equipamento || 'Selecione um material';
    const valorDiaria = parseNumber(material?.custoDiario ?? item.valorUnitario, 0);
    const totalItem = calculateItemTotal(item);

    return (
      <Paper
        key={field.id}
        ref={(el) => {
          // Armazenar ref do elemento para scroll
          if (el) {
            itemRefs.current[index] = el;
          } else {
            delete itemRefs.current[index];
          }
        }}
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {equipamento}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {categoria}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip
              label={`Diária: ${formatCurrency(valorDiaria)}`}
              size="small"
              variant="outlined"
            />
            <Chip label={`Total: ${formatCurrency(totalItem)}`} color="primary" size="small" />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Controller
              name={`itens.${index}.materialId`}
              control={control}
              defaultValue={item.materialId || ''}
              render={({ field: controllerField }) => {
                const selectedMaterial = getMaterialById(controllerField.value);
                const inputValue = materialInputValues[index] !== undefined 
                  ? materialInputValues[index] 
                  : (selectedMaterial ? `${selectedMaterial.equipamento} — ${formatCurrency(parseNumber(selectedMaterial.custoDiario, 0))}` : '');
                
                // Só abre o menu se houver texto digitado E o campo estiver focado (tipo Google)
                const hasText = inputValue && inputValue.trim().length > 0;
                const isFocused = materialFocusStates[index] === true;
                const shouldOpen = hasText && isFocused;
                
                return (
                  <Autocomplete
                    options={materiais}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        const mat = getMaterialById(option);
                        return mat ? `${mat.equipamento} — ${formatCurrency(parseNumber(mat.custoDiario, 0))}` : '';
                      }
                      return `${option.equipamento} — ${formatCurrency(parseNumber(option.custoDiario, 0))}`;
                    }}
                    value={selectedMaterial || null}
                    inputValue={inputValue}
                    open={shouldOpen}
                    onInputChange={(event, newInputValue, reason) => {
                      // Atualizar o valor do input quando o usuário digitar
                      setMaterialInputValues(prev => ({
                        ...prev,
                        [index]: newInputValue
                      }));
                      
                      // Se o usuário limpou o campo ou está digitando, limpar a seleção
                      if (reason === 'clear' || reason === 'input') {
                        controllerField.onChange('');
                        setValue(`itens.${index}.materialId`, '', { shouldDirty: true });
                        setValue(`itens.${index}.valorUnitario`, 0, { shouldDirty: true });
                      }
                    }}
                    onChange={(event, newValue) => {
                      const materialId = newValue ? newValue._id : '';
                      controllerField.onChange(materialId);
                      
                      // Atualizar o texto do input quando selecionar um material
                      if (newValue) {
                        const displayText = `${newValue.equipamento} — ${formatCurrency(parseNumber(newValue.custoDiario, 0))}`;
                        setMaterialInputValues(prev => ({
                          ...prev,
                          [index]: displayText
                        }));
                        
                        const valorUnitario = parseNumber(newValue.custoDiario, 0);
                        setValue(
                          `itens.${index}.valorUnitario`,
                          valorUnitario,
                          { shouldDirty: true, shouldValidate: true }
                        );
                        setValue(`itens.${index}.materialId`, materialId, { shouldDirty: true });
                        // Forçar atualização imediata dos cálculos
                        requestAnimationFrame(() => {
                          setCalcKey(prev => prev + 1);
                        });
                      }
                    }}
                    filterOptions={(options, { inputValue }) => {
                      // Buscar em qualquer parte do nome do equipamento (início, meio ou fim)
                      const searchTerm = inputValue.trim();
                      if (!searchTerm) return [];
                      
                      // Converter o termo de busca para minúsculas para comparação case-insensitive
                      const searchTermLower = searchTerm.toLowerCase();
                      
                      return options.filter((option) => {
                        // Buscar no nome do equipamento
                        const equipamento = (option.equipamento || '').toLowerCase();
                        // Buscar na categoria
                        const categoria = (option.categoria || '').toLowerCase();
                        
                        // Verificar se o termo de busca está em qualquer parte do equipamento ou categoria
                        return equipamento.includes(searchTermLower) || categoria.includes(searchTermLower);
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Material"
                        placeholder="Digite para buscar (ex: 600)..."
                        variant="outlined"
                        onFocus={() => {
                          setMaterialFocusStates(prev => ({ ...prev, [index]: true }));
                        }}
                        onBlur={() => {
                          // Delay para permitir seleção de item do menu
                          setTimeout(() => {
                            setMaterialFocusStates(prev => ({ ...prev, [index]: false }));
                          }, 200);
                        }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      return option._id === value._id;
                    }}
                    noOptionsText="Nenhum material encontrado"
                    freeSolo={false}
                    selectOnFocus
                    clearOnBlur={false}
                    handleHomeEndKeys
                    autoHighlight
                    blurOnSelect
                    ListboxProps={{
                      style: {
                        maxHeight: '300px', // Limitar altura do menu
                      },
                    }}
                  />
                );
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Controller
              name={`itens.${index}.quantidade`}
              control={control}
              defaultValue={item.quantidade ?? 1}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      type="number"
                      label="Quantidade"
                      inputProps={{ min: 1, step: '1' }}
                      onChange={(e) => {
                        controllerField.onChange(e);
                        const newValue = parseNumber(e.target.value, 1);
                        setValue(`itens.${index}.quantidade`, newValue, { shouldDirty: true, shouldValidate: true });
                        // Forçar atualização imediata dos cálculos
                        requestAnimationFrame(() => {
                          setCalcKey(prev => prev + 1);
                        });
                      }}
                    />
                  )}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Controller
              name={`itens.${index}.dias`}
              control={control}
              defaultValue={item.dias ?? 1}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      type="number"
                      label="Dias"
                      inputProps={{ min: 1, step: '1' }}
                      onChange={(e) => {
                        controllerField.onChange(e);
                        const newValue = parseNumber(e.target.value, 1);
                        setValue(`itens.${index}.dias`, newValue, { shouldDirty: true, shouldValidate: true });
                        // Forçar atualização imediata dos cálculos
                        requestAnimationFrame(() => {
                          setCalcKey(prev => prev + 1);
                        });
                      }}
                      InputProps={{
                        endAdornment: index === 0 && fields.length > 1 ? (
                          <Tooltip title="Aplicar este valor em todos os itens abaixo">
                            <IconButton
                              size="small"
                              onClick={applyDiasToAll}
                              sx={{ mr: -1 }}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null,
                      }}
                    />
                  )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Controller
              name={`itens.${index}.descontoPercentual`}
              control={control}
              defaultValue={item.descontoPercentual ?? 0}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      type="number"
                      label="Desconto %"
                      inputProps={{ min: 0, max: 100, step: '0.01' }}
                      onChange={(e) => {
                        controllerField.onChange(e);
                        const newValue = parseNumber(e.target.value, 0);
                        // Limpar desconto em valor quando usar percentual
                        if (newValue > 0) {
                          setValue(`itens.${index}.descontoValor`, 0, { shouldDirty: true });
                        }
                        setValue(`itens.${index}.descontoPercentual`, newValue, { shouldDirty: true, shouldValidate: true });
                        // Forçar atualização imediata dos cálculos
                        requestAnimationFrame(() => {
                          setCalcKey(prev => prev + 1);
                        });
                      }}
                      InputProps={{
                        endAdornment: index === 0 && fields.length > 1 ? (
                          <Tooltip title="Aplicar este valor em todos os itens abaixo">
                            <IconButton
                              size="small"
                              onClick={applyDescontoPercentualToAll}
                              sx={{ mr: -1 }}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null,
                      }}
                    />
                  )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Controller
              name={`itens.${index}.descontoValor`}
              control={control}
              defaultValue={item.descontoValor ?? 0}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      type="number"
                      label="Desconto (R$)"
                      inputProps={{ min: 0, step: '0.01' }}
                      onChange={(e) => {
                        controllerField.onChange(e);
                        const newValue = parseNumber(e.target.value, 0);
                        // Limpar desconto percentual quando usar valor
                        if (newValue > 0) {
                          setValue(`itens.${index}.descontoPercentual`, 0, { shouldDirty: true });
                        }
                        setValue(`itens.${index}.descontoValor`, newValue, { shouldDirty: true, shouldValidate: true });
                        // Forçar atualização imediata dos cálculos
                        requestAnimationFrame(() => {
                          setCalcKey(prev => prev + 1);
                        });
                      }}
                      InputProps={{
                        endAdornment: index === 0 && fields.length > 1 ? (
                          <Tooltip title="Aplicar este valor em todos os itens abaixo">
                            <IconButton
                              size="small"
                              onClick={applyDescontoValorToAll}
                              sx={{ mr: -1 }}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null,
                      }}
                    />
                  )}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
          <Tooltip title="Mover para cima">
            <span>
              <IconButton
                size="small"
                onClick={() => moveItemUp(index)}
                disabled={index === 0}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Mover para baixo">
            <span>
              <IconButton
                size="small"
                onClick={() => moveItemDown(index)}
                disabled={index === fields.length - 1}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remover">
            <IconButton size="small" color="error" onClick={() => removeItem(index)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setError(null);

      // Filtrar itens válidos (remover itens sem materialId)
      const itensValidos = (data.itens || []).filter((item) => {
        return item && item.materialId; // Remover apenas itens sem materialId
      });
      
      // Verificar se há duplicação real (mesmo item em posições diferentes)
      // Usar um Set para rastrear itens já processados
      const seenItems = new Map();
      const itensSemDuplicacao = [];
      
      itensValidos.forEach((item, index) => {
        // Criar uma chave única baseada no conteúdo do item
        const key = `${item.materialId}-${item.quantidade}-${item.dias}-${item.valorUnitario}-${item.descontoPercentual}-${item.descontoValor}`;
        
        if (!seenItems.has(key)) {
          seenItems.set(key, true);
          itensSemDuplicacao.push(item);
        } else {
          console.warn(`Item duplicado detectado e removido na posição ${index}:`, item);
        }
      });
      
      if (itensValidos.length !== itensSemDuplicacao.length) {
        console.warn(`Removidos ${itensValidos.length - itensSemDuplicacao.length} itens duplicados antes de salvar`);
      }

      // Preparar dados dos itens
      const itensCompletos = itensSemDuplicacao.map((item, index) => {
        const material = getMaterialById(item.materialId);
        const quantidade = parseNumber(item.quantidade, 1);
        const dias = parseNumber(item.dias, 1);
        const valorUnitario = parseNumber(item.valorUnitario ?? material?.custoDiario, 0);
        const descontoPercentual = parseNumber(item.descontoPercentual, 0);
        const descontoValor = parseNumber(item.descontoValor, 0);
        const subtotalItem = quantidade * dias * valorUnitario;
        const descontoItem = descontoPercentual > 0 ? (subtotalItem * descontoPercentual) / 100 : descontoValor;
        const valorFinal = Math.max(subtotalItem - descontoItem, 0);
        return {
          materialId: item.materialId,
          categoria: material?.categoria || '',
          equipamento: material?.equipamento || '',
          custoDiario: valorUnitario,
          quantidade,
          dias,
          valorUnitario,
          valorTotal: subtotalItem,
          descontoPercentual,
          descontoValor,
          valorFinal,
          posicao: item.posicao !== undefined ? parseInt(item.posicao, 10) : index, // Posição do item
        };
      });

      const subtotalItensRequest = itensCompletos.reduce((sum, item) => sum + item.valorFinal, 0);
      const valorFinalOrcamento = calculateTotal();

      // Processar datas para evitar problemas de timezone
      // Garantir que as datas sejam enviadas como strings no formato YYYY-MM-DD
      // para que o backend possa processar corretamente
      const processDate = (dateValue) => {
        if (!dateValue) return null;
        // Se for um Date object, converter para string YYYY-MM-DD
        if (dateValue instanceof Date) {
          const year = dateValue.getFullYear();
          const month = String(dateValue.getMonth() + 1).padStart(2, '0');
          const day = String(dateValue.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        // Se já está no formato YYYY-MM-DD, retornar como está
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        // Tentar converter outras strings de data para YYYY-MM-DD
        if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        }
        return dateValue;
      };

      // Processar descontos gerais para garantir que sejam números
      const descontoGeralPercentual = parseNumber(data.descontoGeral || 0, 0);
      const descontoValorGeralNumero = parseNumber(data.descontoValorGeral || 0, 0);

      // Validar campos obrigatórios antes de enviar
      if (!data.jobName || data.jobName.trim() === '') {
        setError('Nome do trabalho é obrigatório');
        setSaving(false);
        return;
      }
      
      if (!data.clienteId) {
        setError('Cliente é obrigatório');
        setSaving(false);
        return;
      }
      
      if (!data.colaboradorId) {
        setError('Responsável (colaborador) é obrigatório');
        setSaving(false);
        return;
      }

      // Preparar dados do orçamento
      const orcamentoData = {
        jobName: data.jobName.trim(),
        clienteId: data.clienteId,
        colaboradorId: data.colaboradorId,
        // Processar datas para manter o dia exato (enviar como string YYYY-MM-DD)
        dataInicio: processDate(data.dataInicio),
        dataFim: processDate(data.dataFim),
        dataPagamento: processDate(data.dataPagamento),
        // Campos do projeto
        produtor: data.produtor || '',
        diretor: data.diretor || '',
        eletricista: data.eletricista || '',
        dirFotografia: data.dirFotografia || '',
        maquinista: data.maquinista || '',
        // Status
        status: data.status || 'PENDENTE',
        // Observações
        observacao: data.observacao || '',
        // Processar descontos gerais como números
        descontoGeral: descontoGeralPercentual,
        descontoValorGeral: descontoValorGeralNumero,
        // Itens e valores calculados
        itens: itensCompletos,
        subtotal: subtotalItensRequest,
        valorTotal: subtotalItensRequest,
        valorFinal: valorFinalOrcamento,
        valorTotalComDesconto: valorFinalOrcamento, // Garantir que o valor com desconto seja salvo
      };

      if (id) {
        await orcamentoService.update(id, orcamentoData);
        setSuccess('Orçamento atualizado com sucesso!');
      } else {
        await orcamentoService.create(orcamentoData);
        setSuccess('Orçamento criado com sucesso!');
      }

      setTimeout(() => {
        navigate('/orcamentos');
      }, 2000);

    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao salvar orçamento';
      setError(errorMessage);
      console.error('Detalhes do erro:', err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando orçamento...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {id ? 'Editar Orçamento' : 'Novo Orçamento'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/orcamentos')}
          >
            Cancelar
          </Button>
        </Box>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Passo 1: Informações Básicas */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Job"
                    {...control.register('jobName', { required: 'Nome do job é obrigatório' })}
                    error={!!errors.jobName}
                    helperText={errors.jobName?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="clienteId"
                    control={control}
                    rules={{ required: 'Cliente é obrigatório' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.clienteId}>
                        <InputLabel>Cliente</InputLabel>
                        <Select {...field} label="Cliente" value={field.value || ''}>
                          {clientes.map((cliente) => (
                            <MenuItem key={cliente._id} value={cliente._id}>
                              {cliente.nome}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.clienteId && (
                          <FormHelperText>{errors.clienteId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="colaboradorId"
                    control={control}
                    rules={{ required: 'Responsável é obrigatório' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.colaboradorId}>
                        <InputLabel>Responsável</InputLabel>
                        <Select {...field} label="Responsável" value={field.value || ''}>
                          {colaboradores.map((colaborador) => (
                            <MenuItem key={colaborador._id} value={colaborador._id}>
                              {colaborador.nome}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.colaboradorId && (
                          <FormHelperText>{errors.colaboradorId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Produtor"
                    {...control.register('produtor')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Diretor"
                    {...control.register('diretor')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Eletricista"
                    {...control.register('eletricista')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Diretor de Fotografia"
                    {...control.register('dirFotografia')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maquinista"
                    {...control.register('maquinista')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="dataInicio"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="date"
                        label="Data de Início"
                        InputLabelProps={{ shrink: true }}
                        value={field.value || ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="dataFim"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="date"
                        label="Data de Fim (Devolução)"
                        InputLabelProps={{ shrink: true }}
                        value={field.value || ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="dataPagamento"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="date"
                        label="Data de Pagamento"
                        InputLabelProps={{ shrink: true }}
                        value={field.value || ''}
                        helperText="Data prevista para recebimento do pagamento"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Passo 2: Itens do Orçamento */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
                mb={3}
              >
                <Typography variant="h6">
                  Itens do Orçamento ({fields.length})
                </Typography>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={agruparPorCategoria}
                        onChange={async (event) => {
                          const nextValue = event.target.checked;
                          setValue('agruparPorCategoria', nextValue, { shouldDirty: true });
                          if (nextValue) {
                            await persistOrder();
                          }
                        }}
                      />
                    }
                    label="Agrupar por categoria"
                  />
                </Box>
              </Box>

              {fields.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                  </Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={addItem}>
                    Adicionar Item
                  </Button>
                </Box>
              ) : agruparPorCategoria ? (
                <>
                  {groupedItems.map(([categoria, indexes], groupIndex) => (
                    <Box key={categoria} mb={3}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={1.5} flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={600}>
                          {categoria}
                        </Typography>
                        <Chip label={`${indexes.length} item(s)`} size="small" variant="outlined" />
                        <Chip
                          label={formatCurrency(getGroupTotal(indexes))}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Stack spacing={2}>
                        {indexes.map((itemIndex) => renderItemCard(itemIndex))}
                      </Stack>
                      {groupIndex < groupedItems.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  ))}
                  {/* Botão sempre embaixo quando agrupado */}
                  <Box mt={3} display="flex" justifyContent="center">
                    <Button variant="contained" startIcon={<Add />} onClick={addItem} size="large">
                      Adicionar Item
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Stack spacing={2}>
                    {fields.map((_, index) => renderItemCard(index))}
                  </Stack>
                  {/* Botão sempre embaixo quando não agrupado */}
                  <Box mt={3} display="flex" justifyContent="center">
                    <Button variant="contained" startIcon={<Add />} onClick={addItem} size="large">
                      Adicionar Item
                    </Button>
                  </Box>
                </>
              )}

              {fields.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box 
                    display="flex" 
                    flexDirection="column"
                    gap={1.5}
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Subtotal dos itens:
                      </Typography>
                      <Chip 
                        label={formatCurrency(subtotalItens)} 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    {(watchedDescontoGeral || watchedDescontoValorGeral) && (
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Desconto Geral:
                        </Typography>
                        <Chip
                          label={`- ${formatCurrency(
                            watchedDescontoGeral 
                              ? (subtotalItens * parseNumber(watchedDescontoGeral, 0)) / 100
                              : parseNumber(watchedDescontoValorGeral, 0)
                          )}`}
                          sx={{ 
                            fontWeight: 'bold',
                            bgcolor: 'error.light',
                            color: 'error.contrastText'
                          }}
                        />
                      </Box>
                    )}
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" color="text.secondary" fontWeight="medium">
                        Total com descontos:
                      </Typography>
                      <Chip
                        label={formatCurrency(totalComDesconto)}
                        color="primary"
                        sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                      />
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passo 2: Descontos e Totais */}
        {activeStep === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Descontos e Totais
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="descontoGeral"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Desconto Geral (%)"
                        inputProps={{ min: 0, max: 100, step: '0.01' }}
                        onChange={(e) => {
                          field.onChange(e);
                          // Limpar desconto em valor quando usar percentual
                          if (e.target.value) {
                            setValue('descontoValorGeral', 0, { shouldDirty: true });
                          }
                          // Forçar atualização imediata dos cálculos
                          requestAnimationFrame(() => {
                            setCalcKey(prev => prev + 1);
                          });
                        }}
                        helperText={field.value ? `Desconto de ${formatCurrency((subtotalItens * parseNumber(field.value, 0)) / 100)}` : ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="descontoValorGeral"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Desconto Geral (R$)"
                        inputProps={{ min: 0, step: '0.01' }}
                        onChange={(e) => {
                          field.onChange(e);
                          // Limpar desconto percentual quando usar valor
                          if (e.target.value) {
                            setValue('descontoGeral', 0, { shouldDirty: true });
                          }
                          // Forçar atualização imediata dos cálculos
                          requestAnimationFrame(() => {
                            setCalcKey(prev => prev + 1);
                          });
                        }}
                        helperText={field.value ? `Desconto de ${formatCurrency(parseNumber(field.value, 0))}` : ''}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box mt={3} p={3} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" gutterBottom>
                  Resumo Financeiro (Atualizado em Tempo Real)
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">
                      Subtotal dos Itens:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(subtotalItens)}
                    </Typography>
                  </Box>
                  {(watchedDescontoGeral || watchedDescontoValorGeral) && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" color="text.secondary">
                        Desconto Geral:
                      </Typography>
                      <Typography variant="body1" color="error.main" fontWeight="bold">
                        - {formatCurrency(
                          watchedDescontoGeral 
                            ? (subtotalItens * parseNumber(watchedDescontoGeral, 0)) / 100
                            : parseNumber(watchedDescontoValorGeral, 0)
                        )}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">
                      Total Final:
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(totalComDesconto)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Passo 3: Revisão */}
        {activeStep === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revisão Final
              </Typography>
              <Typography variant="body1" mb={3}>
                Revise todas as informações antes de salvar o orçamento.
              </Typography>
              
              {/* Resumo Financeiro */}
              <Box mt={3} p={3} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" gutterBottom>
                  Resumo Financeiro
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">
                      Subtotal dos Itens:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(subtotalItens)}
                    </Typography>
                  </Box>
                  {(watchedDescontoGeral || watchedDescontoValorGeral) && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" color="text.secondary">
                        Desconto Geral:
                      </Typography>
                      <Typography variant="body1" color="error.main" fontWeight="bold">
                        - {formatCurrency(
                          watchedDescontoGeral 
                            ? (subtotalItens * parseNumber(watchedDescontoGeral, 0)) / 100
                            : parseNumber(watchedDescontoValorGeral, 0)
                        )}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">
                      Total Final:
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(totalComDesconto)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Navegação */}
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Voltar
          </Button>
          <Box>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Próximo
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={saving}
              >
                {saving ? 'Salvando...' : id ? 'Atualizar' : 'Criar'}
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default OrcamentoForm;

