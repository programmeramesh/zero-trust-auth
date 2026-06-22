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
  const { token } = useParams<{ token?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Preparing your verification status...');
  const [details, setDetails] = useState('Please wait while we check your verification link.');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('success');
        setMessage('Please verify your account');
        setDetails(
          'A verification email has been sent to your address. Click the activation link inside the email to complete registration. If you do not receive it within a few minutes, please check your spam folder or request a new verification email.'
        );
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully.');
        setDetails('Your account is now active. You can sign in and continue to your secure dashboard.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to verify email.');
        setDetails('Please try again or contact support if the issue persists.');
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
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
            Email Verification
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            SecureVault account activation
          </Typography>

          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {status !== 'loading' && (
            <Alert severity={status === 'success' ? 'success' : 'error'} sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {message}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {details}
              </Typography>
            </Alert>
          )}

          {status !== 'loading' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Return to Login
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
