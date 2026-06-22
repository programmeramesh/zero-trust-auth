import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, deviceAPI } from '../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete,
  VerifiedUser,
  Block,
  Cloud,
  Devices as DevicesIcon,
  Logout,
  Person,
} from '@mui/icons-material';

const Devices = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const currentToken = localStorage.getItem('token');

  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceAPI.getDevices().then((res) => res.data),
    enabled: isAuthenticated,
  });

  const trustMutation = useMutation({
    mutationFn: (deviceId: string) => deviceAPI.trustDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const untrustMutation = useMutation({
    mutationFn: (deviceId: string) => deviceAPI.untrustDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => deviceAPI.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authAPI.getSessions().then((res) => res.data.sessions),
    enabled: isAuthenticated,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (token: string) => authAPI.revokeSession(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: () => authAPI.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () => authAPI.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (isLoading || sessionsQuery.isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)' }}>
      <AppBar
        position="static"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
        }}
      >
        <Toolbar>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'white',
              mr: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            <Cloud sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
          </Avatar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            ZeroTrust Security
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <Person />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Device Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your trusted and untrusted devices
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Error loading devices
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }}>
              <DevicesIcon fontSize="inherit" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Your Devices
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Browser</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>OS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Seen</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Posture</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices?.map((device: any) => (
                  <TableRow key={device._id}>
                    <TableCell>{device.browser || 'Unknown'}</TableCell>
                    <TableCell>{device.os || 'Unknown'}</TableCell>
                    <TableCell>{device.ipAddress}</TableCell>
                    <TableCell>
                      {new Date(device.lastSeen).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.postureStatus ? device.postureStatus.toUpperCase() : 'UNKNOWN'}
                        color={device.postureStatus === 'poor' ? 'error' : device.postureStatus === 'moderate' ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {device.trusted ? (
                        <Chip
                          icon={<VerifiedUser />}
                          label="Trusted"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : (
                        <Chip
                          icon={<Block />}
                          label="Untrusted"
                          color="default"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {device.trusted ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => untrustMutation.mutate(device._id)}
                            disabled={untrustMutation.isPending}
                          >
                            Untrust
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => trustMutation.mutate(device._id)}
                            disabled={trustMutation.isPending}
                          >
                            Trust
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => deleteMutation.mutate(device._id)}
                          disabled={deleteMutation.isPending}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper
          sx={{
            p: 3,
            mt: 4,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ fontSize: 32, color: theme.palette.primary.main }}>
                <DevicesIcon fontSize="inherit" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Active Sessions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revoke stale sessions or sign out of other browsers.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => revokeOtherSessionsMutation.mutate()}
                disabled={revokeOtherSessionsMutation.isPending}
              >
                Revoke Other Sessions
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => revokeAllSessionsMutation.mutate()}
                disabled={revokeAllSessionsMutation.isPending}
              >
                Revoke All Sessions
              </Button>
            </Box>
          </Box>

          {sessionsQuery.error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              Unable to load sessions
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Activity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Current</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionsQuery.data?.map((session: any) => (
                  <TableRow key={session.token}>
                    <TableCell>{session.device || session.userAgent || 'Unknown'}</TableCell>
                    <TableCell>{session.ipAddress || 'Unknown'}</TableCell>
                    <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(session.lastActivity).toLocaleString()}</TableCell>
                    <TableCell>
                      {session.token === currentToken ? (
                        <Chip label="This session" color="primary" size="small" />
                      ) : (
                        <Chip label="Other session" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => revokeSessionMutation.mutate(session.token)}
                        disabled={revokeSessionMutation.isPending || session.token === currentToken}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default Devices;
