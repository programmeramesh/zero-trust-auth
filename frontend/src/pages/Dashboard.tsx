import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  useTheme,
  LinearProgress,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { 
  Security,
  Devices,
  History,
  Logout,
  Person,
  Cloud,
  Lock,
  Warning,
  Speed,
  Shield,
} from '@mui/icons-material';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['my-dashboard'],
    queryFn: () => dashboardAPI.getMyDashboard().then((res) => res.data),
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

  const deviceCount = dashboardData?.devices?.length || 0;
  const trustedDeviceCount = dashboardData?.devices?.filter((d: any) => d.trusted).length || 0;
  const untrustedDeviceCount = deviceCount - trustedDeviceCount;
  const totalEvents = dashboardData?.securityEvents?.length || 0;
  const activeSessions = dashboardData?.activeSessions ?? (dashboardData?.user?.sessions?.length || 0);
  const recentActivities = dashboardData?.recentActivities || [];
  const securityEvents = dashboardData?.securityEvents || [];

  const sortedRiskDevices = useMemo(() => {
    return [...(dashboardData?.devices || [])]
      .filter((device: any) => typeof device.riskScore === 'number')
      .sort((a: any, b: any) => b.riskScore - a.riskScore)
      .slice(0, 3);
  }, [dashboardData?.devices]);

  const averageRisk = useMemo(() => {
    const scores = (dashboardData?.devices || []).filter((device: any) => typeof device.riskScore === 'number');
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum: number, device: any) => sum + device.riskScore, 0) / scores.length);
  }, [dashboardData?.devices]);

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
        <Typography variant="h6" color="white">
          Loading your secure workspace...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }}>
      <AppBar
        position="static"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: '0 4px 25px rgba(25, 118, 210, 0.35)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'white',
              mr: 2,
              boxShadow: '0 2px 14px rgba(0,0,0,0.16)',
            }}
          >
            <Cloud sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              Vaultly Dashboard
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Secure insights, trusted sessions, and posture-aware monitoring.
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <Person />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Hello, {user?.name || 'Security Officer'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here is your centralized security posture, device summary, and live event feed.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 50, height: 50 }}>
                    <Shield sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Active Sessions
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {activeSessions}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Currently authorized sessions and active refresh tokens for your user.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, width: 50, height: 50 }}>
                    <Devices sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trusted Devices
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {trustedDeviceCount}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Devices approved for seamless access and low-risk posture.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.error.main, width: 50, height: 50 }}>
                    <Warning sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Security Alerts
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {totalEvents}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Latest issues detected in your account and device activity.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, width: 50, height: 50 }}>
                    <Speed sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Average Risk
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {averageRisk}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Risk score is based on device posture and access behavior.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Device posture and trust map
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review active devices, trust status, and risk levels at a glance.
                  </Typography>
                </Box>
                <Button variant="contained" onClick={() => navigate('/devices')}>
                  Review Devices
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Trusted versus untrusted devices
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={deviceCount ? (trustedDeviceCount / deviceCount) * 100 : 0}
                    sx={{ height: 12, borderRadius: 6, backgroundColor: 'grey.200' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Trusted: {trustedDeviceCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Untrusted: {untrustedDeviceCount}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<Shield />} label="Healthy posture" color="success" />
                    <Chip icon={<Warning />} label="Warning posture" color="warning" />
                    <Chip icon={<Lock />} label="High risk posture" color="error" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Top devices by risk score are highlighted below.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Top risk devices
              </Typography>
              {sortedRiskDevices.length ? (
                sortedRiskDevices.map((device: any) => (
                  <Box key={device._id} sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {device.deviceName || device.deviceId || 'Unknown device'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status: {device.postureStatus || 'Unknown'} • Last Seen: {new Date(device.lastSeen).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                      Risk score: {device.riskScore ?? 'N/A'}%
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No device risk data available yet.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <History color="primary" sx={{ fontSize: 30 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent activity
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivities.slice(0, 5).map((activity: any) => (
                  <Box key={activity._id} sx={{ p: 2, borderRadius: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.createdAt).toLocaleString()} • {activity.ipAddress || 'Unknown IP'}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button variant="text" sx={{ mt: 2, fontWeight: 700 }} onClick={() => navigate('/activity-logs')}>
                View all activity →
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <Security color="error" sx={{ fontSize: 30 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent security events
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {securityEvents.slice(0, 5).map((event: any) => (
                  <Box key={event._id} sx={{ p: 2, borderRadius: 3, bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {event.threatType || 'Security event'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.severity} • {new Date(event.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button variant="text" sx={{ mt: 2, fontWeight: 700, color: 'error.main' }} onClick={() => navigate('/security-events')}>
                View all events →
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
