import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import UnitBrowser from './UnitBrowser';
import DetachmentBrowser from './DetachmentBrowser';
import SpecialRulesBrowser from './SpecialRulesBrowser';
import WargearBrowser from './WargearBrowser';
import WeaponBrowser from './WeaponBrowser';

const RulesBrowser: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the browser from the URL path
  const pathSegments = location.pathname.split('/');
  const selectedBrowser = pathSegments.length > 2 ? pathSegments[2] : null;

  const browserOptions = [
    {
      id: 'unit-browser',
      name: 'Unit Browser',
      description: 'Browse all available units by faction and battlefield role',
      icon: '👥',
    },
    {
      id: 'detachment-browser',
      name: 'Detachment Browser',
      description:
        'Browse all available detachments and their slot configurations',
      icon: '⚔️',
    },
    {
      id: 'special-rules-browser',
      name: 'Special Rules Browser',
      description: 'Browse all special rules and their descriptions',
      icon: '📖',
    },
    {
      id: 'wargear-browser',
      name: 'Wargear Browser',
      description: 'Browse all wargear options and their effects',
      icon: '🛡️',
    },
    {
      id: 'weapon-browser',
      name: 'Weapon Browser',
      description:
        'Browse all weapons with their characteristics and special rules',
      icon: '🔫',
    },
  ];

  const handleBrowserSelect = (browserId: string) => {
    navigate(`/rules-browser/${browserId}`);
  };

  const handleBackToBrowserMenu = () => {
    navigate('/rules-browser');
  };

  const renderBrowserMenu = () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Select a Browser
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a category to browse the available rules and units
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {browserOptions.map(option => (
          <Box key={option.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                onClick={() => handleBrowserSelect(option.id)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ fontSize: '3rem', mb: 2 }}>
                    {option.icon}
                  </Typography>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {option.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {option.description}
                  </Typography>
                  <ArrowForward color="action" />
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Container>
  );

  const renderSelectedBrowser = () => {
    const selectedOption = browserOptions.find(
      option => option.id === selectedBrowser
    );

    if (!selectedOption) return null;

    // Render Special Rules Browser
    if (selectedBrowser === 'special-rules-browser') {
      return <SpecialRulesBrowser />;
    }

    // Render Wargear Browser
    if (selectedBrowser === 'wargear-browser') {
      return <WargearBrowser />;
    }

    // Render Weapon Browser
    if (selectedBrowser === 'weapon-browser') {
      return <WeaponBrowser />;
    }

    // Render Detachment Browser
    if (selectedBrowser === 'detachment-browser') {
      return <DetachmentBrowser />;
    }

    // Render Unit Browser
    if (selectedBrowser === 'unit-browser') {
      return <UnitBrowser />;
    }

    // Render placeholder for other browsers
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToBrowserMenu}
            sx={{ mb: 2 }}
          >
            Back to Browser Menu
          </Button>
          <Typography variant="h4" component="h2" gutterBottom>
            {selectedOption.name}
          </Typography>
        </Box>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
            {selectedOption.icon}
          </Typography>
          <Typography variant="h5" component="h3" gutterBottom>
            {selectedOption.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            This browser is not yet implemented.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedOption.description}
          </Typography>
        </Paper>
      </Container>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              if (selectedBrowser) {
                handleBackToBrowserMenu();
              } else {
                navigate('/');
              }
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="h1">
            {selectedBrowser
              ? browserOptions.find(option => option.id === selectedBrowser)
                  ?.name || 'Rules Browser'
              : 'Rules Browser'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ py: 2 }}>
        {selectedBrowser ? renderSelectedBrowser() : renderBrowserMenu()}
      </Box>
    </Box>
  );
};

export default RulesBrowser;
