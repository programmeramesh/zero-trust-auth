import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyMFA, clearError, clearMFA } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import { Security } from '@mui/icons-material';

const MFAVerify = () => {
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { loading, error, tempToken } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    
    if (!tempToken) {
      navigate('/login');
      return;
    }

    const result = await dispatch(verifyMFA({ tempToken, otp }));
    if (verifyMFA.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    dispatch(clearMFA());
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                mb: 2,
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
              }}
            >
              <Security sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ZeroTrust Security
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Secure Cloud Platform
            </Typography>
          </Box>

          <Typography component="h2" variant="h5" align="center" sx={{ mb: 3, fontWeight: 600 }}>
            Two-Factor Authentication
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Enter the 6-digit code from your authenticator app or the code sent to your email.
          </Alert>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="otp"
              label="Authentication Code"
              name="otp"
              autoComplete="one-time-code"
              autoFocus
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(value);
              }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
                },
              }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleBack}
              sx={{ mb: 2, py: 1.5 }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default MFAVerify;
