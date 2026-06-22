import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import type { RootState, AppDispatch } from '../store';
import { useSelector } from 'react-redux';
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
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import { 
  Cloud, 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Email, 
  Security,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const loadCaptcha = async () => {
    try {
      const response = await authAPI.getCaptcha();
      setCaptchaId(response.data.captchaId);
      setCaptchaSvg(response.data.svg);
      setCaptchaInput('');
    } catch (err) {
      console.error('Failed to load captcha', err);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage('');
    setResendError('');

    if (!email) {
      setResendError('Enter your email to resend verification.');
      return;
    }

    try {
      const response = await authAPI.resendVerification({ email });
      setResendMessage(response.data.message);
    } catch (err: any) {
      setResendError(err.response?.data?.message || 'Failed to resend verification email.');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  useEffect(() => {
    loadCaptcha();
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);

    const result = await dispatch(
      login({ email, password, captchaId, captchaInput })
    );
    
    if (login.fulfilled.match(result)) {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (result.payload.requiresMFA) {
        navigate('/mfa-verify');
      } else {
        navigate('/dashboard');
      }
    }

    setIsSubmitting(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          top: '-100px',
          right: '-100px',
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          bottom: '-50px',
          left: '-50px',
          filter: 'blur(40px)',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Logo and Branding */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Zoom in timeout={1000}>
                <Avatar
                  sx={{
                    width: 90,
                    height: 90,
                    bgcolor: 'primary.main',
                    mb: 2,
                    boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  <Cloud sx={{ fontSize: 52 }} />
                </Avatar>
              </Zoom>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                ZeroTrust Security
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Security sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Enterprise-Grade Security Platform
                </Typography>
              </Box>
            </Box>

            <Typography component="h2" variant="h5" align="center" sx={{ mb: 3, fontWeight: 700 }}>
              Welcome Back
            </Typography>

            {/* Error and Success Messages */}
            <Zoom in={!!error}>
              <Box>
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
                    icon={<ErrorIcon fontSize="inherit" />}
                  >
                    {error}
                  </Alert>
                )}
              </Box>
            </Zoom>
            <Zoom in={!!resendMessage}>
              <Box>
                {resendMessage && (
                  <Alert 
                    severity="success" 
                    sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
                    icon={<CheckCircle fontSize="inherit" />}
                  >
                    {resendMessage}
                  </Alert>
                )}
              </Box>
            </Zoom>
            <Zoom in={!!resendError}>
              <Box>
                {resendError && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
                    icon={<ErrorIcon fontSize="inherit" />}
                  >
                    {resendError}
                  </Alert>
                )}
              </Box>
            </Zoom>

            <Box component="form" onSubmit={handleSubmit}>
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError}
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                error={!!passwordError}
                helperText={passwordError}
                sx={{ mb: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Remember Me and Forgot Password */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                    Forgot password?
                  </Typography>
                </Link>
              </Box>

              {/* CAPTCHA Section */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Box
                  sx={{
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Security Verification
                  </Typography>
                  <Tooltip title="Refresh CAPTCHA">
                    <IconButton size="small" onClick={loadCaptcha} sx={{ ml: 1 }}>
                      <Security fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    mb: 1.5,
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={loadCaptcha}
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="captchaInput"
                  label="Enter the characters shown above"
                  name="captchaInput"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  size="small"
                  helperText="Case-sensitive"
                />
              </Box>

              {/* Email Verification Resend */}
              {error?.includes('verify your email') && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Didn't receive the verification email?
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={handleResendVerification}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    Resend Verification Email
                  </Button>
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.8,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: '0 8px 30px rgba(25, 118, 210, 0.4)',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(25, 118, 210, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.3s ease',
                }}
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <CircularProgress size={28} color="inherit" />
                ) : (
                  'Sign In Securely'
                )}
              </Button>

              <Divider sx={{ my: 3 }} />

              {/* Sign Up Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Don't have an account?
                </Typography>
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="text"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        borderRadius: 2,
                      },
                    }}
                  >
                    Create Your Account
                  </Button>
                </Link>
              </Box>
            </Box>

            {/* Security Badge */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, opacity: 0.7 }}>
                <Lock sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="text.secondary">
                  Protected by enterprise-grade security
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
