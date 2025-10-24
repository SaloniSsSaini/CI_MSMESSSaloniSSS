import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, Container, Box, CssBaseline } from '@mui/material';
import theme from './theme';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import MSMERegistration from './components/MSMERegistration';
import Dashboard from './components/Dashboard';
import CarbonFootprint from './components/CarbonFootprint';
import CarbonSavings from './components/CarbonSavings';
import Recommendations from './components/Recommendations';
import IncentivesScreen from './components/IncentivesScreen';
import ReportingScreen from './components/ReportingScreen';
import MultiAgentManagement from './components/MultiAgentManagement';
import MultiAgentDashboard from './components/MultiAgentDashboard';
import OptimizedMultiAgentDashboard from './components/OptimizedMultiAgentDashboard';
import GreenLoans from './components/GreenLoans';
import CarbonForecastingGraph from './components/CarbonForecastingGraph';
import DocumentUpload from './components/DocumentUpload';
import DocumentManagement from './components/DocumentManagement';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
          <Header />
          
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<MSMERegistration />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/carbon-footprint" element={<CarbonFootprint />} />
              <Route path="/carbon-savings" element={<CarbonSavings />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/incentives" element={<IncentivesScreen />} />
              <Route path="/reporting" element={<ReportingScreen />} />
              <Route path="/multi-agent-management" element={<MultiAgentManagement />} />
              <Route path="/multi-agent-dashboard" element={<MultiAgentDashboard />} />
              <Route path="/optimized-multi-agent-dashboard" element={<OptimizedMultiAgentDashboard />} />
              <Route path="/green-loans" element={<GreenLoans />} />
              <Route path="/carbon-forecasting" element={<CarbonForecastingGraph />} />
              <Route path="/document-upload" element={<DocumentUpload />} />
              <Route path="/document-management" element={<DocumentManagement />} />
            </Routes>
          </Container>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;