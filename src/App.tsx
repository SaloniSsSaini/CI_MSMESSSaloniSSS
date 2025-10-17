import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Nature as EcoIcon } from '@mui/icons-material';
import MSMERegistration from './components/MSMERegistration';
import Dashboard from './components/Dashboard';
import CarbonFootprint from './components/CarbonFootprint';
import Recommendations from './components/Recommendations';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <EcoIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Carbon Intelligence - MSME
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<MSMERegistration />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/carbon-footprint" element={<CarbonFootprint />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;