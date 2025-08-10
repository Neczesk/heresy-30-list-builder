import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Google, Logout, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton: React.FC = () => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      setShowLoginDialog(false);
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          src={currentUser.photoURL || undefined}
          alt={currentUser.displayName || 'User'}
          sx={{ width: 32, height: 32 }}
        >
          <AccountCircle />
        </Avatar>
        <Typography
          variant="body2"
          sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {currentUser.displayName || currentUser.email}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <Logout />}
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} /> : <Google />}
        onClick={() => setShowLoginDialog(true)}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In with Google'}
      </Button>

      <Dialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign In</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sign in with your Google account to sync your army lists, custom
              detachments, and custom units to the cloud.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Google />}
              onClick={handleSignIn}
              disabled={loading}
              fullWidth
              size="large"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Benefits of signing in:</strong>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="ul"
              sx={{ mt: 1 }}
            >
              <li>Sync your data across devices</li>
              <li>Backup your army lists and custom content</li>
              <li>Access your data from any browser</li>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoginDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
