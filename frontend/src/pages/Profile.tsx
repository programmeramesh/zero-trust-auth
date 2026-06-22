import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Container, Paper, Typography, Button, TextField, Alert, Avatar, CircularProgress } from '@mui/material';
import { Security } from '@mui/icons-material';
import type { AppDispatch, RootState } from '../store';
import { fetchCurrentUser, enableMFA, confirmMFAAction, disableMFAAction, clearMFASetup } from '../store/slices/authSlice';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error, mfaSetup } = useSelector((s: RootState) => s.auth);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!user) dispatch(fetchCurrentUser());
  }, [dispatch, user]);

  const handleEnable = async () => {
    await dispatch(enableMFA());
  };

  const handleConfirm = async () => {
    if (otp.length !== 6) return;
    await dispatch(confirmMFAAction({ otp }));
    setOtp('');
  };

  const handleDisable = async () => {
    if (!window.confirm('Disable MFA? This will remove two-factor protection.')) return;
    const code = prompt('Enter a current MFA code to confirm disabling');
    if (!code) return;
    await dispatch(disableMFAAction({ otp: code }));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }} elevation={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}><Security /></Avatar>
            <Typography variant="h5">Account Profile</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle1">Name: {user?.name}</Typography>
          <Typography variant="subtitle1">Email: {user?.email}</Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Multi-Factor Authentication</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Status: {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
            </Typography>

            {!user?.mfaEnabled && !mfaSetup && (
              <Button variant="contained" onClick={handleEnable} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Enable MFA'}
              </Button>
            )}

            {mfaSetup && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>Scan this QR code with your authenticator app or enter the secret manually.</Alert>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={mfaSetup.qrCode} alt="mfa-qr" style={{ width: 160, height: 160, background: '#fff' }} />
                  <Box>
                    <Typography variant="body2">Secret: {mfaSetup.secret}</Typography>
                    <TextField label="Enter code from app" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} sx={{ mt: 1 }} />
                    <Box sx={{ mt: 1 }}>
                      <Button variant="contained" onClick={handleConfirm} disabled={loading || otp.length !== 6} sx={{ mr: 1 }}>
                        Confirm
                      </Button>
                      <Button variant="outlined" onClick={() => dispatch(clearMFASetup())}>Cancel</Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {user?.mfaEnabled && (
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="error" onClick={handleDisable} disabled={loading}>
                  Disable MFA
                </Button>
              </Box>
            )}

          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;
