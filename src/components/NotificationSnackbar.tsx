import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Slide, SlideProps } from '@mui/material';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationSnackbarProps {
  notification: Notification | null;
  onClose: () => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  notification,
  onClose,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setOpen(true);
    }
  }, [notification]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!notification) return null;

  const getSeverity = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={notification.duration || 6000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          borderRadius: 2,
        },
      }}
    >
      <Alert
        onClose={handleClose}
        severity={getSeverity(notification.type)}
        variant="filled"
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        {notification.title && (
          <AlertTitle sx={{ fontWeight: 600 }}>
            {notification.title}
          </AlertTitle>
        )}
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;