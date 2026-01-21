import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ApiService from '../services/api';

interface RequireMSMEProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that checks if the current user has MSME data.
 * If user is MSME role but has no business data, redirects to registration.
 * Otherwise, renders children (the protected component).
 */
const RequireMSME: React.FC<RequireMSMEProps> = ({ children }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasMSME, setHasMSME] = useState(false);

    useEffect(() => {
        checkMSMEStatus();
    }, []);

    const checkMSMEStatus = async () => {
        try {
            // Try to get MSME profile
            const msmeResponse = await ApiService.getMSMEProfile();

            if (msmeResponse?.data) {
                // Has MSME data - allow access
                setHasMSME(true);
            } else {
                // No MSME data - redirect to registration
                navigate('/msme-registration');
            }
        } catch (error: any) {
            // 404 or error means no MSME data
            if (error.message?.includes('not found') || error.response?.status === 404) {
                // User is MSME role but no business data - redirect
                navigate('/msme-registration');
            } else {
                // Other error (e.g., not MSME role) - allow access
                console.log('Not MSME user or other error:', error.message);
                setHasMSME(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return hasMSME ? <>{children}</> : null;
};

export default RequireMSME;
