import { Box, Typography, Card, CardContent, LinearProgress, Chip, Avatar } from '@mui/material';
import { Shield, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SecurityHealthScoreProps {
  score: number;
  breakdown: {
    mfaEnabled: number;
    emailVerified: number;
    passwordStrength: number;
    deviceSecurity: number;
    activityHealth: number;
    securityEventHealth: number;
  };
  recommendations?: Array<{
    priority: string;
    message: string;
  }>;
}

const SecurityHealthScore: React.FC<SecurityHealthScoreProps> = ({ score, breakdown, recommendations = [] }) => {
  const theme = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const breakdownItems = [
    { label: 'MFA Status', value: breakdown.mfaEnabled, max: 20 },
    { label: 'Email Verification', value: breakdown.emailVerified, max: 15 },
    { label: 'Password Strength', value: breakdown.passwordStrength, max: 15 },
    { label: 'Device Security', value: breakdown.deviceSecurity, max: 15 },
    { label: 'Activity Health', value: breakdown.activityHealth, max: 20 },
    { label: 'Security Events', value: breakdown.securityEventHealth, max: 15 },
  ];

  return (
    <Card 
      sx={{ 
        borderRadius: 3, 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: `${scoreColor}.main`,
                width: 56,
                height: 56,
                boxShadow: `0 4px 20px rgba(${theme.palette[scoreColor].main}, 0.4)`,
              }}
            >
              <Shield sx={{ color: 'white', fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Security Health Score
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall security posture assessment
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: `${scoreColor}.main` }}>
              {score}%
            </Typography>
            <Chip 
              label={scoreLabel} 
              color={scoreColor as any}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Overall Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={score}
            color={scoreColor as any}
            sx={{ 
              height: 12, 
              borderRadius: 6,
              backgroundColor: 'grey.200',
              boxShadow: `0 2px 8px rgba(${theme.palette[scoreColor].main}, 0.2)`,
            }}
          />
        </Box>

        {/* Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Score Breakdown
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {breakdownItems.map((item) => (
              <Box key={item.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.value}/{item.max}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(item.value / item.max) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recommendations.map((rec, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: rec.priority === 'high' ? 'error.light' : 'warning.light',
                    border: `1px solid ${rec.priority === 'high' ? 'error.main' : 'warning.main'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  {rec.priority === 'high' ? (
                    <ErrorIcon color="error" fontSize="small" sx={{ mt: 0.25 }} />
                  ) : (
                    <Warning color="warning" fontSize="small" sx={{ mt: 0.25 }} />
                  )}
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {rec.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityHealthScore;
