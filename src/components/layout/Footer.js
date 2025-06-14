import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box
    component="footer"
    sx={{
      width: '100%',
      py: 2,
      px: 2,
      mt: 'auto',
      backgroundColor: '#263238',
      color: '#fff',
      textAlign: 'center',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 1000,
    }}
  >
    <Typography variant="body2">
      &copy; {new Date().getFullYear()} Finance Tracker. All rights reserved.
    </Typography>
  </Box>
);

export default Footer; 