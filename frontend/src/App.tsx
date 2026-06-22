import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryProvider } from './components/QueryProvider';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import theme from './theme/theme';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import MFAVerify from './pages/MFAVerify';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import ActivityLogs from './pages/ActivityLogs';
import SecurityEvents from './pages/SecurityEvents';
import Profile from './pages/Profile';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/mfa-verify" element={<MFAVerify />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/security-events" element={<SecurityEvents />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </QueryProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
