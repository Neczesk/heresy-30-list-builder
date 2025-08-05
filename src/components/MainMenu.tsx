import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, Palette } from '@mui/icons-material';
import ThemeSelector from './ThemeSelector';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleThemeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  return (
    <>
      {/* App Bar with Hamburger Menu */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Horus Heresy 3.0
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleThemeMenuOpen}>
              <ListItemIcon>
                <Palette fontSize="small" />
              </ListItemIcon>
              <ListItemText>Theme</ListItemText>
            </MenuItem>
          </Menu>

          {/* Theme Selector Menu */}
          <Menu
            anchorEl={themeMenuAnchor}
            open={Boolean(themeMenuAnchor)}
            onClose={handleThemeMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <ThemeSelector />
          </Menu>
        </Toolbar>
      </AppBar>

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
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/army-builder')}
                  >
                    Create New Army List
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
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
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/csv-creator')}
                  >
                    CSV Creator
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
                    variant="contained"
                    color="primary"
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
    </>
  );
};

export default MainMenu;
