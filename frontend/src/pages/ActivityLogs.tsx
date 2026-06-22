import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store';
import { useQuery } from '@tanstack/react-query';
import { activityLogAPI } from '../services/api';
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
  History,
  Cloud,
  Logout,
  Person,
} from '@mui/icons-material';

const ActivityLogs = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['my-activity-logs'],
    queryFn: () => activityLogAPI.getMyLogs(100).then((res) => res.data),
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
            Activity Logs
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View your recent activity history
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Error loading activity logs
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
            <History sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Activity
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{log.action}</TableCell>
                    <TableCell>{log.resource || '-'}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.success ? 'Success' : 'Failed'}
                        color={log.success ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
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

export default ActivityLogs;
