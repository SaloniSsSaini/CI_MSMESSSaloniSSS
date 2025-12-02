import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
    Park as EcoIcon,
    AccountCircle as AccountIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Dashboard as DashboardIcon,
    Assessment as AssessmentIcon,
    Park as EcoSavingsIcon,
    Lightbulb as RecommendationsIcon,
    EmojiEvents as IncentivesIcon,
    Description as ReportsIcon,
    AccountBalance as LoansIcon,
    CloudUpload as UploadIcon,
    Folder as DocumentsIcon,
    Security as PrivacyIcon,
    MailOutline as MailAgentIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isRegistered, hasCompletedRegistration, logout } = useRegistration();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    if (!isRegistered && path !== '/') {
      navigate('/');
      handleMenuClose();
      return;
    }

    navigate(path);
    handleMenuClose();
  };
  const handleForgotPassword = (path: string) => {
    if (!isRegistered && path !== '/') {
      navigate(path);
      // handleMenuClose();
      return;
    }

    navigate(path);
    handleMenuClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAuthAction = () => {
    handleMenuClose();

    if (isRegistered) {
      logout();
      navigate('/');
      return;
    }

    navigate('/');
  };

    const navigationItems = [
      { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/carbon-footprint', label: 'Carbon Assessment', icon: <AssessmentIcon /> },
    //   { path: '/ai-email-agent', label: 'AI Email Agent', icon: <MailAgentIcon /> },
    //   { path: '/carbon-savings', label: 'Carbon Savings', icon: <EcoSavingsIcon /> },
    // { path: '/recommendations', label: 'Recommendations', icon: <RecommendationsIcon /> },
    // { path: '/incentives', label: 'Incentives', icon: <IncentivesIcon /> },
    // { path: '/reporting', label: 'Reports', icon: <ReportsIcon /> },
    // { path: '/green-loans', label: 'Green Loans', icon: <LoansIcon /> },
    // { path: '/document-upload', label: 'Upload', icon: <UploadIcon /> },
    { path: '/document-management', label: 'Documents', icon: <DocumentsIcon /> },
    { path: '/data-privacy', label: 'Data Privacy', icon: <PrivacyIcon /> },
  ];

  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        {/* Logo and Brand */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            mr: 4
          }}
          onClick={() => navigate(isRegistered ? '/dashboard' : '/')}
        >
          <EcoIcon sx={{ mr: 2, fontSize: 32, color: 'white' }} />
          <Box>
            <Typography variant="h5" component="div" sx={{ 
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2
            }}>
              Carbon Intelligence
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500
            }}>
              MSME Platform
            </Typography>
          </Box>
        </Box>

        {/* Navigation Items */}
        <Box
          sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center',
            gap: 1,
            flexGrow: 1
          }}
        >
          {isRegistered ? (
            navigationItems.map((item) => (
              <Box
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive(item.path) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isActive(item.path) ? 600 : 500,
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500,
              }}
            >
              Complete registration to unlock all platform features.
            </Typography>
          )}
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            onClick={handleMenuOpen}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {isRegistered && (
              <MenuItem onClick={() => handleNavigation('/dashboard')}>
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
              </MenuItem>
            )}
            
            {isRegistered && <Divider />}
            
            <MenuItem onClick={() => handleNavigation('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            
            <Divider />

            {!isRegistered && (
              <>
              <MenuItem onClick={() => handleForgotPassword('/forgot-password')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Forget Password</ListItemText>
              </MenuItem>
              <Divider />
              </>
            )}
            
            <MenuItem onClick={handleAuthAction}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {isRegistered ? 'Logout' : hasCompletedRegistration ? 'Login' : 'Back to Registration'}
              </ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;