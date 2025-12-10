import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  People,
  Person,
  Inventory,
  Assessment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Orçamentos', icon: <Receipt />, path: '/orcamentos' },
  { text: 'Clientes', icon: <People />, path: '/clientes' },
  { text: 'Colaboradores', icon: <Person />, path: '/colaboradores' },
  { text: 'Materiais', icon: <Inventory />, path: '/materiais' },
  { text: 'Relatórios', icon: <Assessment />, path: '/relatorios' },
];

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#2196f3',
          color: 'white',
        },
      }}
    >
      <Box 
        sx={{ 
          p: 2,
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src="/Aicon.png"
          alt="Aicon"
          sx={{
            height: 70,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;

