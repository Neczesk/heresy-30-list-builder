# Horus Heresy 3.0 Army List Builder

A React-based web application for building and managing army lists for the Horus Heresy 3.0 tabletop wargame. Built with React, TypeScript, and Vite.

## Features

- **Army List Creation**: Build complete army lists with detachments, units, and upgrades
- **Custom Units & Detachments**: Create and manage custom units and detachments
- **Rules Browser**: Browse game rules, units, weapons, and special rules
- **Data Management**: Save and load army lists locally
- **React Router**: Clean URL-based navigation between different sections

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Material-UI** for UI components
- **ESLint + Prettier** for code quality and formatting

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Auto Linting and Formatting

This project is configured with ESLint and Prettier for automatic code quality and formatting:

#### Available Scripts

- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Automatically fix linting issues where possible
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check if code is properly formatted

#### VS Code Integration

The project includes VS Code configuration for automatic formatting and linting:

- **Auto-format on save**: Code will be automatically formatted when you save files
- **Auto-fix on save**: ESLint errors will be automatically fixed when possible
- **Recommended extensions**: The project includes a list of recommended VS Code extensions

#### Configuration Files

- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `eslint.config.js` - ESLint configuration
- `.vscode/settings.json` - VS Code workspace settings
- `.vscode/extensions.json` - Recommended VS Code extensions

#### Current Linting Status

The project currently has:
- ✅ **0 errors** - All critical issues resolved
- ⚠️ **77 warnings** - Mostly TypeScript `any` type usage (acceptable for development)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
