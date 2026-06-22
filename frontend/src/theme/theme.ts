import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c4dff',
      light: '#b388ff',
      dark: '#651fff',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.08)',
    '0 4px 8px rgba(0,0,0,0.12)',
    '0 8px 16px rgba(0,0,0,0.14)',
    '0 12px 24px rgba(0,0,0,0.16)',
    '0 16px 32px rgba(0,0,0,0.18)',
    '0 20px 40px rgba(0,0,0,0.20)',
    '0 24px 48px rgba(0,0,0,0.22)',
    '0 28px 56px rgba(0,0,0,0.24)',
    '0 32px 64px rgba(0,0,0,0.26)',
    '0 36px 72px rgba(0,0,0,0.28)',
    '0 40px 80px rgba(0,0,0,0.30)',
    '0 44px 88px rgba(0,0,0,0.32)',
    '0 48px 96px rgba(0,0,0,0.34)',
    '0 52px 104px rgba(0,0,0,0.36)',
    '0 56px 112px rgba(0,0,0,0.38)',
    '0 60px 120px rgba(0,0,0,0.40)',
    '0 64px 128px rgba(0,0,0,0.42)',
    '0 68px 136px rgba(0,0,0,0.44)',
    '0 72px 144px rgba(0,0,0,0.46)',
    '0 76px 152px rgba(0,0,0,0.48)',
    '0 80px 160px rgba(0,0,0,0.50)',
    '0 84px 168px rgba(0,0,0,0.52)',
    '0 88px 176px rgba(0,0,0,0.54)',
    '0 92px 184px rgba(0,0,0,0.56)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;
