import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Alert,
} from '@mui/material';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to verify email.');
      }
    };

    verify();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Email Verification
          </Typography>

          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {status !== 'loading' && (
            <Alert severity={status === 'success' ? 'success' : 'error'} sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {status !== 'loading' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
