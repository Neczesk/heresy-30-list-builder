import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  Security,
  Build,
  Flag,
  Book,
} from '@mui/icons-material';
import { useTheme } from '../contexts/useTheme';
import type { ThemeName } from '../contexts/themeUtils';

const themeOptions: Array<{
  name: ThemeName;
  displayName: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    name: 'light',
    displayName: 'Typed Orders',
    description: 'Cyan, Magenta, Yellow (Light Mode)',
    icon: <LightMode />,
  },
  {
    name: 'dark',
    displayName: 'Neon Dark',
    description: 'Deep Sky Blue, Hot Pink, Lime Green',
    icon: <DarkMode />,
  },
  {
    name: 'legion',
    displayName: 'Legion Wireframe',
    description: 'Red, Gold, Orange Red neon',
    icon: <Security />,
  },
  {
    name: 'mechanicum',
    displayName: 'Mechanicum Tech',
    description: 'Orange, Teal, Dark Orange glow',
    icon: <Build />,
  },
  {
    name: 'imperial',
    displayName: 'Imperial Neon',
    description: 'Blue, Red, Blue wireframe',
    icon: <Flag />,
  },
  {
    name: 'parchment',
    displayName: 'Parchment',
    description: 'Old paper and ink aesthetic',
    icon: <Book />,
  },
];

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <Box sx={{ minWidth: 250 }}>
      <Typography variant="h6" sx={{ px: 2, py: 1 }}>
        Choose Theme
      </Typography>
      <Divider />
      <List>
        {themeOptions.map(theme => (
          <ListItem key={theme.name} disablePadding>
            <ListItemButton
              selected={currentTheme === theme.name}
              onClick={() => setTheme(theme.name)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {theme.icon}
              </ListItemIcon>
              <ListItemText
                primary={theme.displayName}
                secondary={theme.description}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ThemeSelector;
