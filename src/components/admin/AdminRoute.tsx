import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that protects admin-only routes
 * Checks if user has admin role before allowing access
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const [checking, setChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = () => {
        const token = localStorage.getItem('token');
        const adminUser = localStorage.getItem('adminUser');

        if (!token) {
            setIsAdmin(false);
            setChecking(false);
            return;
        }

        try {
            const user = adminUser ? JSON.parse(adminUser) : null;

            if (user?.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('Error parsing admin user:', error);
            setIsAdmin(false);
        }

        setChecking(false);
    };

    if (checking) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
