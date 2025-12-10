# 🎬 AiconERP Frontend

Frontend React moderno com Material-UI para o Sistema AiconERP - Gestão de Orçamentos Cinematográficos.

## ✨ Funcionalidades

### 🏠 Dashboard
- Estatísticas em tempo real
- Cards de status dos orçamentos
- Lista de orçamentos recentes
- Próximos vencimentos

### 📋 Gestão Completa
- **Orçamentos**: CRUD completo, workflow de status, PDFs
- **Clientes**: CRUD com busca avançada
- **Colaboradores**: Gestão completa com status ativo/inativo
- **Materiais**: Controle de equipamentos e categorias
- **Extras**: Gestão de extras (frete, transporte, etc.)
- **Financeiro**: Controle de pagamentos e relatórios
- **Lixeira**: Soft delete com restauração

### 📄 PDFs
- Orçamento/Ordem de Serviço
- Fatura de Locação
- Checklist de Equipamentos

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- Backend AiconERP rodando

### Instalação
```bash
npm install
```

### Executar
```bash
# Desenvolvimento
npm start

# Build para produção
npm run build
```

O frontend estará disponível em: `http://localhost:3000`

### Variáveis de Ambiente
Crie `.env` ou `.env.production`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏗️ Estrutura

```
src/
├── components/
│   ├── Layout/          # Header, Sidebar
│   ├── Dashboard/       # Dashboard principal
│   ├── Orcamentos/      # CRUD de orçamentos
│   ├── Clientes/        # CRUD de clientes
│   ├── Colaboradores/   # CRUD de colaboradores
│   ├── Materiais/       # CRUD de materiais
│   ├── Extras/          # CRUD de extras
│   ├── Financeiro/      # Controle financeiro
│   ├── Relatorios/      # Relatórios
│   └── Lixeira/         # Lixeira de orçamentos
├── services/
│   └── api.js           # Serviços de API
└── App.js               # Rotas principais
```

## 🎨 Tecnologias

- **React 18** - Framework
- **Material-UI 5** - Componentes
- **React Router 6** - Navegação
- **React Hook Form** - Formulários
- **Axios** - HTTP Client
- **@mui/x-data-grid** - Tabelas avançadas
- **date-fns** - Datas

## 🚀 Deploy

O projeto está configurado para deploy no **Vercel**:

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure `REACT_APP_API_URL` com a URL do backend
4. Deploy automático!

Consulte `DEPLOY-GUIDE.md` para instruções detalhadas.

## 📊 Status

✅ **100% Funcional**
- 15+ Componentes React
- Integração completa com backend
- Interface moderna e responsiva
- Validações e feedback visual

---

**Desenvolvido para AICON - Ações Cinematográficas LTDA** 🎬
