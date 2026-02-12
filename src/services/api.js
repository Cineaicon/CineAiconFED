import axios from 'axios';

// Usar variável de ambiente em produção, localhost em desenvolvimento
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Serviços para Clientes
export const clienteService = {
  getAll: () => api.get('/clientes'),
  getById: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`),
};

// Serviços para Colaboradores
export const colaboradorService = {
  getAll: () => api.get('/colaboradores'),
  getById: (id) => api.get(`/colaboradores/${id}`),
  create: (data) => api.post('/colaboradores', data),
  update: (id, data) => api.put(`/colaboradores/${id}`, data),
  delete: (id) => api.delete(`/colaboradores/${id}`),
};

// Serviços para Materiais
export const materialService = {
  getAll: () => api.get('/materiais'),
  getById: (id) => api.get(`/materiais/${id}`),
  create: (data) => api.post('/materiais', data),
  update: (id, data) => api.put(`/materiais/${id}`, data),
  delete: (id) => api.delete(`/materiais/${id}`),
  getCategorias: () => api.get('/materiais/categorias/lista'),
  downloadListaPdf: () => api.get('/materiais/lista/pdf', { responseType: 'blob' }),
};

// Serviços para Orçamentos
export const orcamentoService = {
  getAll: (params = {}) => api.get('/orcamentos', { params }),
  getById: (id) => api.get(`/orcamentos/${id}`),
  create: (data) => api.post('/orcamentos', data),
  update: (id, data) => api.put(`/orcamentos/${id}`, data),
  delete: (id) => api.delete(`/orcamentos/${id}`),
  clone: (id) => api.post(`/orcamentos/${id}/clonar`),
  
  // Workflow de status
  updateStatus: (id, status, extras = {}) => api.patch(`/orcamentos/${id}/status`, { status, ...extras }),
  
  // Gestão de itens
  addItem: (orcamentoId, itemData) => api.post(`/orcamentos/${orcamentoId}/itens`, itemData),
  updateItem: (orcamentoId, itemId, itemData) => api.put(`/orcamentos/${orcamentoId}/itens/${itemId}`, itemData),
  removeItem: (orcamentoId, itemId) => api.delete(`/orcamentos/${orcamentoId}/itens/${itemId}`),
  
  // Drag & Drop
  reorderItems: (orcamentoId, novaPosicoes) => api.post(`/orcamentos/${orcamentoId}/reordenar`, { novaPosicoes }),
  
  // Descontos
  applyBulkDiscount: (orcamentoId, descontoPercentual, itemIds) => 
    api.post(`/orcamentos/${orcamentoId}/desconto-massa`, { descontoPercentual, itemIds }),
  
  // Relatórios
  getFinancialReport: (params = {}) => api.get('/orcamentos/financeiro/relatorio', { params }),
  downloadConfirmedReportPdf: (params = {}) =>
    api.get('/orcamentos/relatorios/confirmados/pdf', {
      params,
      responseType: 'blob',
    }),
  
  // PDFs
  generatePDF: (id, tipo) => api.get(`/orcamentos/${id}/pdf/${tipo}`, { responseType: 'blob' }),
};

// Serviços para Extras
export const extraService = {
  getAll: () => api.get('/extras'),
  getById: (id) => api.get(`/extras/${id}`),
  create: (data) => api.post('/extras', data),
  update: (id, data) => api.put(`/extras/${id}`, data),
  delete: (id) => api.delete(`/extras/${id}`),
};

// Serviços para Financeiro
export const financeiroService = {
  getAll: (params = {}) => api.get('/financeiro', { params }),
  getById: (id) => api.get(`/financeiro/${id}`),
  create: (data) => api.post('/financeiro', data),
  update: (id, data) => api.put(`/financeiro/${id}`, data),
  delete: (id) => api.delete(`/financeiro/${id}`),
  updateStatus: (id, statusPagamento, valorPago, dataPagamento) => 
    api.patch(`/financeiro/${id}/status-pagamento`, { statusPagamento, valorPago, dataPagamento }),
  getResumo: (params = {}) => api.get('/financeiro/relatorio/resumo', { params }),
};

// Serviços para Lixeira
export const lixeiraService = {
  getAll: (params = {}) => api.get('/orcamentos-lixeira', { params }),
  getById: (id) => api.get(`/orcamentos-lixeira/${id}`),
  create: (data) => api.post('/orcamentos-lixeira', data),
  restore: (id) => api.post(`/orcamentos-lixeira/${id}/restaurar`),
  delete: (id) => api.delete(`/orcamentos-lixeira/${id}`),
  getStats: () => api.get('/orcamentos-lixeira/stats/resumo'),
};

// Serviços de teste
export const testService = {
  getStatus: () => api.get('/test'),
};

export default api;

