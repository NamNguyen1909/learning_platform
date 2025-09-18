import { createTheme } from '@mui/material/styles';

// Minimalist color palette: black, white, and shades of gray
const palette = {
  primary: {
    main: '#000000', // Black for main actions
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#333333', // Darker gray for secondary elements to improve contrast
    contrastText: '#ffffff',
  },
  background: {
    default: '#ffffff', // White background for body
    paper: '#ffffff',  // White background for containers to avoid low contrast
  },
  text: {
    primary: '#000000',   // Black text
    secondary: '#000000', // Black text for secondary to ensure high contrast
    disabled: '#999999',  // Medium gray for disabled text
  },
  action: {
    hover: '#666666',     // Lighter gray for hover states
  },
  divider: '#cccccc',     // Light gray for borders and dividers
  success: {
    main: '#4caf50',      // Green for success messages
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',      // Red for error messages
    contrastText: '#ffffff',
  },
};

const theme = createTheme({
  palette,
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 16,
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.5px', color: '#000000' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.5px', color: '#000000' },
    h3: { fontWeight: 600, fontSize: '1.5rem', color: '#000000' },
    h4: { fontWeight: 600, fontSize: '1.25rem', color: '#000000' },
    h5: { fontWeight: 500, fontSize: '1.1rem', color: '#000000' },
    h6: { fontWeight: 500, fontSize: '1rem', color: '#000000' },
    body1: { fontSize: '1rem', lineHeight: 1.7, color: '#000000' },
    body2: { fontSize: '0.95rem', lineHeight: 1.6, color: '#000000' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.5px', color: '#ffffff' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          color: '#000000',
          margin: 0,
          padding: 0,
          fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        a: {
          color: '#000000',
          textDecoration: 'none',
          '&:hover': {
            color: '#999999',
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: 20,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          backgroundColor: '#000000',
          color: '#ffffff',
          boxShadow: 'none',
          textTransform: 'none',
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: '#333333',
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        containedSecondary: {
          backgroundColor: '#333333',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#999999',
          },
        },
        outlined: {
          borderColor: '#cccccc',
          color: '#000000',
          '&:hover': {
            borderColor: '#999999',
            backgroundColor: '#ffffff',
          },
        },
        text: {
          color: '#000000',
          '&:hover': {
            color: '#999999',
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          color: '#000000',
          border: '1px solid #cccccc',
          padding: '6px 12px',
          '&.Mui-focused': {
            borderColor: '#333333',
            backgroundColor: '#ffffff',
          },
        },
        input: {
          fontSize: '1rem',
          color: '#000000',
          '&::placeholder': {
            color: '#999999',
          },
          '&:-webkit-autofill': {
            boxShadow: '0 0 0 100px #ffffff inset',
            WebkitTextFillColor: '#000000',
            transition: 'background-color 5000s ease-in-out 0s',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#999999',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#333333',
          },
        },
        notchedOutline: {
          borderColor: '#cccccc',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #cccccc',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#ffffff',
          boxShadow: 'none',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#000000',
          textDecoration: 'none',
          '&:hover': {
            color: '#999999',
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});

export default theme;
