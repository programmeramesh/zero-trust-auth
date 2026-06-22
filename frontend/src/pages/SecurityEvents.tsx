import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store';
import { useQuery } from '@tanstack/react-query';
import { securityEventAPI } from '../services/api';
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
  Security,
  Cloud,
  Logout,
  Person,
  Warning,
} from '@mui/icons-material';

const SecurityEvents = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['my-security-events'],
    queryFn: () => securityEventAPI.getMyEvents(100).then((res) => res.data),
    enabled: isAuthenticated,
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'error';
      case 'INVESTIGATING':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'FALSE_POSITIVE':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
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
            Security Events
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor security threats and incidents
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Error loading security events
          </Alert>
        )}

        {events && events.length === 0 && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
            icon={<Security />}
          >
            No security events detected. Your account is secure!
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'white',
            border: events && events.length > 0 ? '2px solid' : 'none',
            borderColor: events && events.length > 0 ? 'error.light' : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }}>
              <Warning fontSize="inherit" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Security Incidents
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Threat Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events?.map((event: any) => (
                  <TableRow key={event._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{event.threatType}</TableCell>
                    <TableCell>
                      <Chip
                        label={event.severity}
                        color={getSeverityColor(event.severity) as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.status}
                        color={getStatusColor(event.status) as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{event.description || '-'}</TableCell>
                    <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
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

export default SecurityEvents;
