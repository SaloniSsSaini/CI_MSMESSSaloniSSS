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
import DataPrivacy from './components/DataPrivacy';
import AICarbonEmailAgent from './components/AICarbonEmailAgent';
import ProtectedRoute from './components/ProtectedRoute';
import { RegistrationProvider } from './context/RegistrationContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RegistrationProvider>
          <ErrorBoundary>
            <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
              <Header />

              <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Routes>
                  <Route path="/" element={<MSMERegistration />} />
                  <Route
                    path="/dashboard"
                    element={(
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/carbon-footprint"
                    element={(
                      <ProtectedRoute>
                        <CarbonFootprint />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/ai-email-agent"
                    element={(
                      <ProtectedRoute>
                        <AICarbonEmailAgent />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/carbon-savings"
                    element={(
                      <ProtectedRoute>
                        <CarbonSavings />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/recommendations"
                    element={(
                      <ProtectedRoute>
                        <Recommendations />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/incentives"
                    element={(
                      <ProtectedRoute>
                        <IncentivesScreen />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/reporting"
                    element={(
                      <ProtectedRoute>
                        <ReportingScreen />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/multi-agent-management"
                    element={(
                      <ProtectedRoute>
                        <MultiAgentManagement />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/multi-agent-dashboard"
                    element={(
                      <ProtectedRoute>
                        <MultiAgentDashboard />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/optimized-multi-agent-dashboard"
                    element={(
                      <ProtectedRoute>
                        <OptimizedMultiAgentDashboard />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/green-loans"
                    element={(
                      <ProtectedRoute>
                        <GreenLoans />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/carbon-forecasting"
                    element={(
                      <ProtectedRoute>
                        <CarbonForecastingGraph />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/document-upload"
                    element={(
                      <ProtectedRoute>
                        <DocumentUpload />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/document-management"
                    element={(
                      <ProtectedRoute>
                        <DocumentManagement />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/data-privacy"
                    element={(
                      <ProtectedRoute>
                        <DataPrivacy />
                      </ProtectedRoute>
                    )}
                  />
                </Routes>
              </Container>
            </Box>
        </ErrorBoundary>
      </RegistrationProvider>
    </ThemeProvider>
  );
}

export default App;