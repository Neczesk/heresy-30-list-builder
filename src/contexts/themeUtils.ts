import { createTheme } from '@mui/material/styles';

// Define available themes
export type ThemeName =
  | 'light'
  | 'dark'
  | 'legion'
  | 'mechanicum'
  | 'imperial'
  | 'parchment';

// Neon wireframe mixin with CSS custom properties
const createNeonTheme = (
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  isLight: boolean = false
) =>
  createTheme({
    palette: {
      mode: isLight ? 'light' : 'dark',
      primary: {
        main: primaryColor,
        contrastText: isLight ? '#1a1a1a' : '#ffffff',
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        default: isLight ? '#f8fafc' : '#0a0a0a',
        paper: isLight ? '#ffffff' : '#1a1a1a',
      },
      text: {
        primary: isLight ? '#1a1a1a' : '#ffffff',
        secondary: isLight ? '#666666' : '#b0b0b0',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--neon-primary': primaryColor,
            '--neon-secondary': secondaryColor,
            '--neon-accent': accentColor,
            '--neon-glow-primary': `${primaryColor}40`,
            '--neon-glow-secondary': `${secondaryColor}40`,
            '--neon-glow-accent': `${accentColor}40`,
            '--neon-shadow-primary': `0 0 10px ${primaryColor}40, 0 0 20px ${primaryColor}20, 0 0 30px ${primaryColor}10`,
            '--neon-shadow-secondary': `0 0 10px ${secondaryColor}40, 0 0 20px ${secondaryColor}20, 0 0 30px ${secondaryColor}10`,
            '--neon-shadow-accent': `0 0 10px ${accentColor}40, 0 0 20px ${accentColor}20, 0 0 30px ${accentColor}10`,
            '--neon-border-primary': `2px solid ${primaryColor}`,
            '--neon-border-secondary': `2px solid ${secondaryColor}`,
            '--neon-border-accent': `2px solid ${accentColor}`,
            '--neon-text-shadow': `0 0 2px ${primaryColor}, 0 0 0px ${primaryColor}40`,
            '--neon-box-shadow': `0 0 15px ${secondaryColor}40, inset 0 0 15px ${secondaryColor}20`,
            '--neon-gradient': `linear-gradient(90deg, ${primaryColor}70, ${secondaryColor}70, ${accentColor}70, ${primaryColor}70)`,
            '--neon-card-bg': isLight
              ? 'linear-gradient(155deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))'
              : 'linear-gradient(155deg, rgba(39, 39, 39, 0.9), rgba(0, 0, 0, 0.9))',
            '--neon-appbar-bg': isLight
              ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))'
              : 'linear-gradient(90deg, rgba(26, 26, 26, 0.95), rgba(10, 10, 10, 0.95))',
          },
          // Global neon wireframe styles
          'h1, h2, h3, h4, h5, h6': {
            textShadow: isLight
              ? '0 0 3px var(--neon-primary)'
              : 'var(--neon-text-shadow)',
            // borderBottom: 'var(--neon-border-primary)',
            paddingBottom: '8px',
            marginBottom: '16px',
            position: 'relative',
          },
          '.MuiPaper-root.MuiCard-root': {
            border: 'var(--neon-border-secondary)',
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              border: '1px solid var(--neon-accent)',
              opacity: isLight ? '0.2' : '0.3',
              pointerEvents: 'none',
            },
          },
          '.MuiPaper-root.MuiAppBar-root': {
            borderBottom: 'var(--neon-border-primary)',
            boxShadow: 'var(--neon-shadow-primary)',
            background: 'var(--neon-appbar-bg)',
            backdropFilter: 'blur(10px)',
            '& .MuiToolbar-root': {
              borderBottom: '1px solid var(--neon-primary)',
            },
          },

          '.MuiCardContent-root': {
            border: 'none',
            '& .MuiTypography-h5, & .MuiTypography-h6': {
              borderBottom: 'var(--neon-border-primary)',
              textShadow: isLight
                ? '0 0 2px var(--neon-primary)'
                : 'var(--neon-text-shadow)',
              paddingBottom: '8px',
              marginBottom: '16px',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-1px',
                left: '0',
                width: '30%',
                height: '1px',
                background: 'var(--neon-accent)',
                boxShadow: 'var(--neon-shadow-accent)',
              },
            },
          },
          '.MuiMenu-paper': {
            border: 'var(--neon-border-secondary)',
            boxShadow: 'var(--neon-box-shadow)',
            background: isLight
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))'
              : 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(10, 10, 10, 0.95))',
            backdropFilter: 'blur(10px)',
            '& .MuiMenuItem-root': {
              borderBottom: '1px solid var(--neon-glow-secondary)',
              '&:hover': {
                background: 'var(--neon-gradient)',
                boxShadow: 'var(--neon-shadow-accent)',
              },
            },
          },
          '.MuiListItemButton-root': {
            '&.Mui-selected': {
              background: 'var(--neon-gradient)',
              border: 'var(--neon-border-accent)',
              boxShadow: 'var(--neon-shadow-accent)',
              '& .MuiListItemIcon-root': {
                color: 'var(--neon-accent)',
              },
            },
            '&:hover': {
              background: 'var(--neon-gradient)',
              boxShadow: 'var(--neon-shadow-secondary)',
            },
          },
          '.MuiContainer-root': {
            '& .MuiTypography-h2': {
              textShadow: isLight
                ? '0 0 4px var(--neon-primary)'
                : 'var(--neon-text-shadow)',
              paddingBottom: '12px',
              marginBottom: '24px',
              position: 'relative',
            },
            '& .MuiTypography-h4': {
              textShadow: isLight
                ? '0 0 3px var(--neon-primary)'
                : 'var(--neon-text-shadow)',
              paddingBottom: '8px',
              marginBottom: '16px',
              position: 'relative',
            },
          },
          // Additional wireframe effects
          '.MuiDivider-root': {
            background: `linear-gradient(90deg, ${primaryColor}80, ${secondaryColor}80, ${accentColor}80, ${primaryColor}80)`,
            height: '3px',
            boxShadow: 'var(--neon-shadow-secondary)',
            borderRadius: '1px',
          },
          '.MuiIconButton-root': {
            border: '1px solid var(--neon-secondary)',
            boxShadow: 'var(--neon-shadow-secondary)',
            '&:hover': {
              border: 'var(--neon-border-accent)',
              boxShadow: 'var(--neon-shadow-accent)',
            },
          },
          '.MuiTypography-body2': {
            textShadow: isLight
              ? '0 0 1px var(--neon-primary)'
              : '0 0 3px var(--neon-primary)',
          },
          // Override MUI Paper elevation effects
          '.MuiPaper-root[class*="MuiPaper-elevation"]': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
          '.MuiPaper-root.MuiPaper-elevation1': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
          '.MuiPaper-root.MuiPaper-elevation2': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
          '.MuiPaper-root.MuiPaper-elevation3': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
          '.MuiPaper-root.MuiPaper-elevation4': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
          '.MuiPaper-root.MuiPaper-elevation5': {
            background: 'var(--neon-card-bg)',
            boxShadow: 'var(--neon-box-shadow)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            border: 'var(--neon-border-secondary)',
            boxShadow: 'var(--neon-shadow-secondary)',
            textShadow: isLight
              ? '0 0 2px var(--neon-primary)'
              : 'var(--neon-text-shadow)',
            background: isLight
              ? 'linear-gradient(45deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))'
              : 'linear-gradient(45deg, rgba(26, 26, 26, 0.8), rgba(10, 10, 10, 0.8))',
            backdropFilter: 'blur(5px)',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '0',
              left: '-100%',
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, var(--neon-glow-accent), transparent)',
              transition: 'left 0.5s ease',
              boxSizing: 'border-box',
            },
            '&:hover': {
              boxShadow: 'var(--neon-shadow-accent)',
              border: 'var(--neon-border-accent)',
              '&::before': {
                left: '100%',
              },
            },
          },
          text: {
            color: 'white',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            '&.MuiCard-root': {
              border: 'var(--neon-border-secondary)',
              boxShadow: 'var(--neon-box-shadow)',
              background: 'var(--neon-card-bg)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                border: '1px solid var(--neon-accent)',
                opacity: isLight ? '0.2' : '0.3',
                pointerEvents: 'none',
              },
              '&:hover': {
                boxShadow: 'var(--neon-shadow-accent)',
                border: 'var(--neon-border-accent)',
                // transform: 'translateY(-2px)',
                // transition: 'all 0.3s ease',
              },
            },
            '&.MuiAppBar-root': {
              borderBottom: 'var(--neon-border-primary)',
              boxShadow: 'var(--neon-shadow-primary)',
              background: 'var(--neon-appbar-bg)',
              backdropFilter: 'blur(10px)',
            },
          },
          elevation1: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation2: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation3: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation4: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation5: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation6: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation7: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation8: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation9: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation10: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation11: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation12: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation13: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation14: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation15: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation16: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation17: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation18: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation19: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation20: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation21: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation22: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation23: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
          elevation24: {
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: 'var(--neon-border-secondary)',
            boxShadow: 'var(--neon-box-shadow)',
            background: 'var(--neon-card-bg)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              border: '1px solid var(--neon-accent)',
              opacity: isLight ? '0.2' : '0.3',
              pointerEvents: 'none',
            },
            '&:hover': {
              boxShadow: 'var(--neon-shadow-accent)',
              border: 'var(--neon-border-accent)',
              // transform: 'translateY(-2px)',
              // transition: 'all 0.3s ease',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: 'var(--neon-border-primary)',
            boxShadow: 'var(--neon-shadow-primary)',
            background: 'var(--neon-appbar-bg)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
    },
  });

// WW2 Typewriter Document theme function - authentic wartime document styling
const createTypewriterTheme = () =>
  createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2F2F2F', // Dark typewriter ink
        light: '#4A4A4A', // Lighter typewriter gray
        dark: '#1A1A1A', // Very dark ink
        contrastText: '#F5F5DC', // Beige paper
      },
      secondary: {
        main: '#8B4513', // Brown leather/wood
        light: '#CD853F', // Light brown
        dark: '#654321', // Dark brown
        contrastText: '#F5F5DC', // Beige paper
      },
      background: {
        default: '#F5F5DC', // Cream/beige paper background
        paper: '#FAEBD7', // Antique white paper
      },
      text: {
        primary: '#2F2F2F', // Dark typewriter ink
        secondary: '#4A4A4A', // Lighter typewriter gray
      },
      error: {
        main: '#8B0000', // Dark red for military/urgency
        light: '#CD5C5C', // Light red
        dark: '#660000', // Very dark red
      },
      warning: {
        main: '#B8860B', // Dark goldenrod
        light: '#DAA520', // Goldenrod
        dark: '#8B6914', // Dark goldenrod
      },
      info: {
        main: '#2F4F4F', // Dark slate gray
        light: '#708090', // Slate gray
        dark: '#1C1C1C', // Very dark gray
      },
      success: {
        main: '#556B2F', // Dark olive green
        light: '#9ACD32', // Yellow green
        dark: '#2F4F2F', // Dark slate gray
      },
    },
    typography: {
      fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
      h1: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '2.5rem',
        color: '#2F2F2F',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textShadow: '1px 1px 0px rgba(47, 47, 47, 0.3)',
      },
      h2: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '2rem',
        color: '#2F2F2F',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textShadow: '1px 1px 0px rgba(47, 47, 47, 0.3)',
      },
      h3: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        color: '#2F2F2F',
        letterSpacing: '0.05em',
      },
      h4: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '1.25rem',
        color: '#2F2F2F',
      },
      h5: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '1.125rem',
        color: '#2F2F2F',
      },
      h6: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#2F2F2F',
      },
      body1: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: '#2F2F2F',
      },
      body2: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: '#4A4A4A',
      },
      button: {
        fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: `
              linear-gradient(135deg, #F5F5DC 0%, #FAEBD7 50%, #F5F5DC 100%),
              radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.02) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(47, 47, 47, 0.02) 0%, transparent 50%)
            `,
            backgroundAttachment: 'fixed',
            fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
            position: 'relative',
          },
          // Paper texture overlay for authentic document feel
          'body::before': {
            content: '""',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 25px,
                rgba(47, 47, 47, 0.02) 26px,
                rgba(47, 47, 47, 0.02) 27px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 20px,
                rgba(139, 69, 19, 0.01) 21px,
                rgba(139, 69, 19, 0.01) 22px
              )
            `,
            pointerEvents: 'none',
            zIndex: '-1',
          },
          // Typewriter-style selections
          '::selection': {
            backgroundColor: 'rgba(47, 47, 47, 0.2)',
            color: '#2F2F2F',
          },
          // Document headers with typewriter styling
          'h1, h2, h3, h4, h5, h6': {
            borderBottom: '2px solid #2F2F2F',
            paddingBottom: '8px',
            marginBottom: '16px',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-4px',
              left: '0',
              width: '50px',
              height: '2px',
              backgroundColor: '#8B4513',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(135deg, #FAEBD7 0%, #F5F5DC 100%),
              radial-gradient(circle at 30% 70%, rgba(139, 69, 19, 0.03) 0%, transparent 50%)
            `,
            border: '2px solid #8B4513',
            boxShadow: `
              0 2px 8px rgba(47, 47, 47, 0.15),
              inset 0 1px 0 rgba(245, 245, 220, 0.8)
            `,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '10px',
              left: '20px',
              right: '20px',
              bottom: '10px',
              border: '1px solid rgba(47, 47, 47, 0.1)',
              pointerEvents: 'none',
              borderRadius: '2px',
            },
          },
          elevation1: {
            boxShadow: `
              0 2px 8px rgba(47, 47, 47, 0.15),
              inset 0 1px 0 rgba(245, 245, 220, 0.8)
            `,
          },
          elevation2: {
            boxShadow: `
              0 4px 12px rgba(47, 47, 47, 0.2),
              inset 0 1px 0 rgba(245, 245, 220, 0.8)
            `,
          },
          elevation3: {
            boxShadow: `
              0 6px 16px rgba(47, 47, 47, 0.25),
              inset 0 1px 0 rgba(245, 245, 220, 0.8)
            `,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(135deg, #FAEBD7 0%, #F5F5DC 100%),
              radial-gradient(circle at 25% 75%, rgba(139, 69, 19, 0.04) 0%, transparent 50%)
            `,
            border: '3px solid #8B4513',
            boxShadow: `
              0 4px 12px rgba(47, 47, 47, 0.2),
              inset 0 2px 0 rgba(245, 245, 220, 0.9)
            `,
            position: 'relative',
            borderRadius: '2px',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '15px',
              left: '25px',
              right: '25px',
              bottom: '15px',
              border: '1px solid rgba(47, 47, 47, 0.15)',
              pointerEvents: 'none',
              borderRadius: '1px',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '30px',
              height: '30px',
              background: `
                radial-gradient(circle at center,
                  rgba(139, 69, 19, 0.1) 0%,
                  rgba(139, 69, 19, 0.05) 50%,
                  transparent 100%
                )
              `,
              borderRadius: '50%',
              pointerEvents: 'none',
            },
            '&:hover': {
              boxShadow: `
                0 6px 20px rgba(47, 47, 47, 0.3),
                inset 0 2px 0 rgba(245, 245, 220, 0.9)
              `,
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(90deg, #2F2F2F 0%, #4A4A4A 50%, #2F2F2F 100%),
              linear-gradient(180deg, rgba(245, 245, 220, 0.1) 0%, transparent 100%)
            `,
            borderBottom: '3px solid #8B4513',
            boxShadow: `
              0 2px 8px rgba(47, 47, 47, 0.3),
              inset 0 1px 0 rgba(245, 245, 220, 0.2)
            `,
            color: '#F5F5DC',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-1px',
              left: '0',
              right: '0',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, #8B4513, transparent)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #8B4513 100%),
              linear-gradient(45deg, rgba(245, 245, 220, 0.1) 0%, transparent 100%)
            `,
            border: '2px solid #654321',
            fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: `
              0 2px 6px rgba(47, 47, 47, 0.25),
              inset 0 1px 0 rgba(245, 245, 220, 0.3)
            `,
            color: '#F5F5DC',
            borderRadius: '2px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '2px',
              left: '2px',
              right: '2px',
              bottom: '2px',
              border: '1px solid rgba(245, 245, 220, 0.2)',
              borderRadius: '1px',
              pointerEvents: 'none',
            },
            '&:hover': {
              background: `
                linear-gradient(135deg, #654321 0%, #8B4513 50%, #654321 100%),
                linear-gradient(45deg, rgba(245, 245, 220, 0.2) 0%, transparent 100%)
              `,
              boxShadow: `
                0 4px 12px rgba(47, 47, 47, 0.35),
                inset 0 1px 0 rgba(245, 245, 220, 0.3)
              `,
              transform: 'translateY(-1px)',
              borderColor: '#4A4A4A',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: `
                0 2px 6px rgba(47, 47, 47, 0.4),
                inset 0 2px 4px rgba(0, 0, 0, 0.2)
              `,
            },
          },
          text: {
            color: '#2F2F2F',
            background: 'transparent',
            border: '2px solid transparent',
            '&:hover': {
              background: 'rgba(139, 69, 19, 0.1)',
              border: '2px solid rgba(139, 69, 19, 0.3)',
            },
          },
          outlined: {
            border: '2px solid #8B4513',
            color: '#8B4513',
            background: 'transparent',
            '&:hover': {
              background: 'rgba(139, 69, 19, 0.1)',
              borderColor: '#654321',
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(90deg,
                transparent 0%,
                #8B4513 20%,
                #2F2F2F 50%,
                #8B4513 80%,
                transparent 100%
              )
            `,
            height: '2px',
            boxShadow: '0 1px 3px rgba(47, 47, 47, 0.2)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '4px',
              backgroundColor: '#2F2F2F',
              borderRadius: '50%',
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            background: `
              linear-gradient(135deg, #FAEBD7 0%, #F5F5DC 100%),
              radial-gradient(circle at 30% 70%, rgba(139, 69, 19, 0.03) 0%, transparent 50%)
            `,
            border: '2px solid #8B4513',
            boxShadow: `
              0 4px 16px rgba(47, 47, 47, 0.25),
              inset 0 1px 0 rgba(245, 245, 220, 0.8)
            `,
            borderRadius: '2px',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FAEBD7',
              fontFamily:
                '"Courier New", "Lucida Console", "Monaco", monospace',
              '& fieldset': {
                borderColor: '#8B4513',
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: '#654321',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2F2F2F',
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              fontFamily:
                '"Courier New", "Lucida Console", "Monaco", monospace',
              color: '#4A4A4A',
              '&.Mui-focused': {
                color: '#2F2F2F',
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(135deg, #FAEBD7 0%, #F5F5DC 100%)
            `,
            border: '2px solid #8B4513',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            background: `
              linear-gradient(90deg, #2F2F2F 0%, #4A4A4A 50%, #2F2F2F 100%)
            `,
            '& .MuiTableCell-head': {
              color: '#F5F5DC',
              fontFamily:
                '"Courier New", "Lucida Console", "Monaco", monospace',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '2px solid #8B4513',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontFamily: '"Courier New", "Lucida Console", "Monaco", monospace',
            borderBottom: '1px solid rgba(139, 69, 19, 0.3)',
          },
        },
      },
    },
  });

// Parchment theme function - completely separate from neon themes
const createParchmentTheme = () =>
  createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#5D4037', // Dark Brown
        light: '#8D6E63', // Brown
        dark: '#3E2723', // Very Dark Brown
        contrastText: '#FAF0E6', // Light cream
      },
      secondary: {
        main: '#8D6E63', // Brown
        light: '#A1887F', // Light Brown
        dark: '#5D4037', // Dark Brown
        contrastText: '#FAF0E6', // Light cream
      },
      background: {
        default: '#FDFBF7', // Very light cream
        paper: '#FAF8F3', // Light cream
      },
      text: {
        primary: '#2E1B0E', // Very dark brown
        secondary: '#5D4037', // Dark brown
      },
    },
    typography: {
      fontFamily: '"Times New Roman", "Georgia", serif',
      h1: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
      h2: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
      h3: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
      h4: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
      h5: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
      h6: {
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontWeight: 'bold',
        color: '#2E1B0E',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background:
              'linear-gradient(135deg, #FDFBF7 0%, #FAF8F3 50%, #FDFBF7 100%)',
            backgroundAttachment: 'fixed',
            fontFamily: '"Times New Roman", "Georgia", serif',
          },
          // Parchment paper texture overlay
          'body::before': {
            content: '""',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 20% 80%, rgba(93, 64, 55, 0.015) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(141, 110, 99, 0.015) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(93, 64, 55, 0.01) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: '-1',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '1px solid #8D6E63',
            boxShadow: '0 2px 8px rgba(93, 64, 55, 0.15)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: `
                radial-gradient(circle at 30% 70%, rgba(93, 64, 55, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(141, 110, 99, 0.03) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
              borderRadius: 'inherit',
            },
          },
          elevation1: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '1px solid #8D6E63',
            boxShadow: '0 2px 8px rgba(93, 64, 55, 0.15)',
          },
          elevation2: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '1px solid #8D6E63',
            boxShadow: '0 4px 12px rgba(93, 64, 55, 0.2)',
          },
          elevation3: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '1px solid #8D6E63',
            boxShadow: '0 6px 16px rgba(93, 64, 55, 0.25)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '2px solid #5D4037',
            boxShadow: '0 4px 12px rgba(93, 64, 55, 0.2)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: `
                radial-gradient(circle at 25% 75%, rgba(93, 64, 55, 0.04) 0%, transparent 50%),
                radial-gradient(circle at 75% 25%, rgba(141, 110, 99, 0.04) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
              borderRadius: 'inherit',
            },
            '&:hover': {
              boxShadow: '0 6px 20px rgba(93, 64, 55, 0.3)',
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(90deg, #5D4037 0%, #8D6E63 100%)',
            borderBottom: '2px solid #3E2723',
            boxShadow: '0 2px 8px rgba(93, 64, 55, 0.3)',
            color: '#FAF0E6',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #8D6E63 0%, #A1887F 100%)',
            border: '2px solid #5D4037',
            fontFamily: '"Times New Roman", "Georgia", serif',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(93, 64, 55, 0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5D4037 0%, #8D6E63 100%)',
              boxShadow: '0 4px 12px rgba(93, 64, 55, 0.35)',
              transform: 'translateY(-1px)',
            },
          },
          text: {
            color: '#FAF0E6',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            background:
              'linear-gradient(90deg, #5D4037 0%, #8D6E63 50%, #5D4037 100%)',
            height: '2px',
            boxShadow: '0 1px 3px rgba(93, 64, 55, 0.2)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            background: 'linear-gradient(135deg, #FAF8F3 0%, #FDFBF7 100%)',
            border: '2px solid #5D4037',
            boxShadow: '0 4px 16px rgba(93, 64, 55, 0.25)',
          },
        },
      },
    },
  });

// Theme definitions with neon wireframe styling and typewriter document theme
export const themes = {
  light: createTypewriterTheme(), // WW2 Typewriter Document theme - authentic wartime styling
  dark: createNeonTheme('#00bfff', '#ff69b4', '#32cd32'), // Deep Sky Blue, Hot Pink, Lime Green
  legion: createNeonTheme('#ff0000', '#ffd700', '#ff4500'), // Red, Gold, Orange Red
  mechanicum: createNeonTheme('#ff6b35', '#00d4aa', '#ff8c00'), // Orange, Teal, Dark Orange
  imperial: createNeonTheme('#1e3a8a', '#dc2626', '#3b82f6'), // Blue, Red, Blue
  parchment: createParchmentTheme(), // Parchment theme - completely separate from neon themes
};
