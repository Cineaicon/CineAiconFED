import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Layout Components
import Sidebar from './components/Layout/Sidebar';

// Page Components
import Dashboard from './components/Dashboard/Dashboard';
import OrcamentoList from './components/Orcamentos/OrcamentoList';
import OrcamentoForm from './components/Orcamentos/OrcamentoForm';
import OrcamentoDetail from './components/Orcamentos/OrcamentoDetail';
import ClienteList from './components/Clientes/ClienteList';
import ClienteForm from './components/Clientes/ClienteForm';
import MaterialList from './components/Materiais/MaterialList';
import MaterialForm from './components/Materiais/MaterialForm';
import ColaboradorList from './components/Colaboradores/ColaboradorList';
import ColaboradorForm from './components/Colaboradores/ColaboradorForm';
import ExtraList from './components/Extras/ExtraList';
import ExtraForm from './components/Extras/ExtraForm';
import FinanceiroList from './components/Financeiro/FinanceiroList';
import FinanceiroDetail from './components/Financeiro/FinanceiroDetail';
import RelatoriosPage from './components/Relatorios/RelatoriosPage';
import LixeiraList from './components/Lixeira/LixeiraList';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Sidebar open={true} />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: 'calc(100% - 240px)' },
              ml: { sm: '240px' },
              transition: 'margin 0.3s ease',
            }}
          >
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Orçamentos */}
              <Route path="/orcamentos" element={<OrcamentoList />} />
              <Route path="/orcamentos/novo" element={<OrcamentoForm />} />
              <Route path="/orcamentos/:id" element={<OrcamentoDetail />} />
              <Route path="/orcamentos/:id/editar" element={<OrcamentoForm />} />
              
              {/* Clientes */}
              <Route path="/clientes" element={<ClienteList />} />
              <Route path="/clientes/novo" element={<ClienteForm />} />
              <Route path="/clientes/:id/editar" element={<ClienteForm />} />
              
              {/* Colaboradores */}
              <Route path="/colaboradores" element={<ColaboradorList />} />
              <Route path="/colaboradores/novo" element={<ColaboradorForm />} />
              <Route path="/colaboradores/:id/editar" element={<ColaboradorForm />} />
              
              {/* Materiais */}
              <Route path="/materiais" element={<MaterialList />} />
              <Route path="/materiais/novo" element={<MaterialForm />} />
              <Route path="/materiais/:id/editar" element={<MaterialForm />} />
              
              {/* Extras */}
              <Route path="/extras" element={<ExtraList />} />
              <Route path="/extras/novo" element={<ExtraForm />} />
              <Route path="/extras/:id/editar" element={<ExtraForm />} />
              
              {/* Financeiro */}
              <Route path="/financeiro" element={<FinanceiroList />} />
              <Route path="/financeiro/:id" element={<FinanceiroDetail />} />

              {/* Relatórios */}
              <Route path="/relatorios" element={<RelatoriosPage />} />
 
              {/* Lixeira */}
              <Route path="/lixeira" element={<LixeiraList />} />
              
              {/* Fallback */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;