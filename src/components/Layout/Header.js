import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
} from '@mui/material';

const Header = () => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1565c0',
      }}
    >
      <Toolbar>
        <Box
          component="img"
          src="/Aicon.png"
          alt="Aicon"
          sx={{
            height: 50,
            objectFit: 'contain',
            mr: 2,
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;


