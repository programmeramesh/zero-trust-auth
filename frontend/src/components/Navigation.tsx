import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Security,
  Devices,
  History,
  Person,
  Cloud,
  Logout,
  ExpandLess,
  ExpandMore,
  Shield,
  Lock,
  
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface NavigationProps {
  open: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

const drawerWidth = 280;

const Navigation: React.FC<NavigationProps> = ({ open, onClose, user, onLogout }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [securityOpen, setSecurityOpen] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Devices', icon: <Devices />, path: '/devices' },
    { text: 'Activity Logs', icon: <History />, path: '/activity-logs' },
    { text: 'Security Events', icon: <Security />, path: '/security-events' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const securityItems = [
    { text: 'Security Health', icon: <Shield />, path: '/security-health' },
    { text: 'Sessions', icon: <Lock />, path: '/sessions' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        py: 3,
        gap: 2,
      }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'primary.main',
            boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          }}
        >
          <Cloud sx={{ fontSize: 36 }} />
        </Avatar>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
            ZeroTrust
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Security Platform
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          MAIN MENU
        </Typography>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path) ? 'primary.main' : 'inherit',
                    },
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          SECURITY
        </Typography>
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setSecurityOpen(!securityOpen)}>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText primary="Security" />
              {securityOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={securityOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3 }}>
              {securityItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigate(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        '& .MuiTypography-root': { 
                          fontWeight: isActive(item.path) ? 600 : 500,
                          color: isActive(item.path) ? 'primary.main' : 'inherit',
                          fontSize: '0.875rem',
                        },
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          ACCOUNT
        </Typography>
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/profile')}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={onLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ px: 3, py: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
        <Chip 
          label={user?.role || 'User'} 
          size="small" 
          color="primary" 
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Drawer>
  );
};

export default Navigation;
