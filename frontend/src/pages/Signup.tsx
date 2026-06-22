import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signup, clearError } from '../store/slices/authSlice';
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
  LinearProgress,
  Chip,
} from '@mui/material';
import { 
  Cloud, 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Email, 
  Person,
  Security,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const passwordRules = {
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
  };

  const passwordStrengthScore =
    (passwordRules.minLength ? 20 : 0) +
    (password.length >= 12 ? 10 : 0) +
    (password.length >= 16 ? 10 : 0) +
    (passwordRules.uppercase ? 15 : 0) +
    (passwordRules.lowercase ? 15 : 0) +
    (passwordRules.number ? 15 : 0) +
    (passwordRules.specialChar ? 15 : 0);

  const passwordStrengthLabel = () => {
    if (passwordStrengthScore < 30) return 'Weak';
    if (passwordStrengthScore < 50) return 'Fair';
    if (passwordStrengthScore < 70) return 'Good';
    if (passwordStrengthScore < 90) return 'Strong';
    return 'Very Strong';
  };

  const passwordStrengthColor = () => {
    if (passwordStrengthScore < 30) return 'error';
    if (passwordStrengthScore < 50) return 'warning';
    if (passwordStrengthScore < 70) return 'info';
    if (passwordStrengthScore < 90) return 'success';
    return 'success';
  };

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

  const validateName = (name: string) => {
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    if (name.length > 100) {
      setNameError('Name must be less than 100 characters');
      return false;
    }
    setNameError('');
    return true;
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
    if (password.length > 128) {
      setPasswordError('Password must be less than 128 characters');
      return false;
    }
    if (!passwordRules.uppercase) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!passwordRules.lowercase) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!passwordRules.number) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    if (!passwordRules.specialChar) {
      setPasswordError('Password must contain at least one special character');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    // Validate all fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!agreeTerms) {
      setTermsError('You must agree to the terms and conditions');
    } else {
      setTermsError('');
    }

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !agreeTerms) {
      return;
    }

    setIsSubmitting(true);

    const result = await dispatch(
      signup({ name, email, password, captchaId, captchaInput })
    );
    
    if (signup.fulfilled.match(result)) {
      navigate('/verify-email');
    }

    setIsSubmitting(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) validateName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
    if (confirmPasswordError) validateConfirmPassword(confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) validateConfirmPassword(e.target.value);
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
              Create Your Account
            </Typography>

            {/* Error Messages */}
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

            <Box component="form" onSubmit={handleSubmit}>
              {/* Name Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={handleNameChange}
                error={!!nameError}
                helperText={nameError}
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
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
                autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {password && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Password Strength
                    </Typography>
                    <Chip 
                      label={passwordStrengthLabel()} 
                      size="small" 
                      color={passwordStrengthColor() as any}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrengthScore}
                    color={passwordStrengthColor() as any}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              )}

              {/* Password Requirements */}
              {password && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Info fontSize="small" color="primary" />
                    Password Requirements
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.8 }}>
                    {[
                      {
                        label: 'At least 8 characters',
                        valid: passwordRules.minLength,
                      },
                      {
                        label: 'No more than 128 characters',
                        valid: passwordRules.maxLength,
                      },
                      {
                        label: 'At least one uppercase letter',
                        valid: passwordRules.uppercase,
                      },
                      {
                        label: 'At least one lowercase letter',
                        valid: passwordRules.lowercase,
                      },
                      {
                        label: 'At least one number',
                        valid: passwordRules.number,
                      },
                      {
                        label: 'At least one special character',
                        valid: passwordRules.specialChar,
                      },
                    ].map((rule) => (
                      <Box
                        key={rule.label}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {rule.valid ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={rule.valid ? 'text.primary' : 'text.secondary'}
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {rule.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Confirm Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
                sx={{ mb: 2 }}
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
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

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

              {/* Terms and Conditions */}
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (termsError) setTermsError('');
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link to="/terms" style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 500 }}>
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 500 }}>
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
                {termsError && (
                  <Typography variant="caption" color="error" sx={{ ml: 3.5, display: 'block' }}>
                    {termsError}
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
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
                  'Create Account'
                )}
              </Button>

              <Divider sx={{ my: 3 }} />

              {/* Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Already have an account?
                </Typography>
                <Link to="/login" style={{ textDecoration: 'none' }}>
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
                    Sign In
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

export default Signup;
