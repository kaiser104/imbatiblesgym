import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

function Header() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={`${process.env.PUBLIC_URL}/logo.png`} 
            alt="Imbatibles Gym Logo" 
            style={{ height: '50px', marginRight: '10px' }} 
          />
          <Typography variant="h6" noWrap component="div">
            Imbatibles Gym
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
