import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Horus Heresy 3.0
        </Typography>
        <Typography variant="h4" component="h2" color="text.secondary">
          Army List Builder
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Army Lists Section */}
        <Box>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Army Lists
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/army-builder')}
                >
                  Create New Army List
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/load-list')}
                >
                  Load Existing Army List
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Data Management Section */}
        <Box>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Data Management
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/edit-units')}
                >
                  Edit Units
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/edit-detachments')}
                >
                  Edit Detachments
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Reference Section */}
        <Box>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Reference
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/rules-browser')}
                >
                  Rules Browser
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Container>
  );
};

export default MainMenu;
