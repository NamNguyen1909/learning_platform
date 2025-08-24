import { createTheme } from '@mui/material/styles';

// Color palette: Triadic harmony (Blue, Green, Orange)
const palette = {
	primary: {
		main: '#1976d2', // Vibrant blue for main actions
		contrastText: '#fff',
	},
	secondary: {
		main: '#43a047', // Motivating green for highlights
		contrastText: '#fff',
	},
	success: {
		main: '#00bfae', // AI/automation accent
		contrastText: '#fff',
	},
	warning: {
		main: '#ffb300', // Warm yellow for warnings
		contrastText: '#fff',
	},
	error: {
		main: '#e53935', // Clear red for errors
		contrastText: '#fff',
	},
	background: {
		default: '#f7fafd', // Light, clean background
		paper: '#fff',
	},
	text: {
		primary: '#222b45', // Deep blue-gray for readability
		secondary: '#5a6270',
		disabled: '#b0b7c3',
	},
	info: {
		main: '#2979ff',
		contrastText: '#fff',
	},
};

const theme = createTheme({
	palette,
	typography: {
		fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
		fontSize: 16,
		h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.5px' },
		h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.5px' },
		h3: { fontWeight: 600, fontSize: '1.5rem' },
		h4: { fontWeight: 600, fontSize: '1.25rem' },
		h5: { fontWeight: 500, fontSize: '1.1rem' },
		h6: { fontWeight: 500, fontSize: '1rem' },
		body1: { fontSize: '1rem', lineHeight: 1.7 },
		body2: { fontSize: '0.95rem', lineHeight: 1.6 },
		button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.5px' },
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					fontWeight: 600,
					boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
					transition: 'background 0.2s',
				},
				containedPrimary: {
					background: 'linear-gradient(90deg, #1976d2 0%, #2979ff 100%)',
				},
				containedSecondary: {
					background: 'linear-gradient(90deg, #43a047 0%, #00bfae 100%)',
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 16,
					boxShadow: '0 4px 24px 0 rgba(25, 118, 210, 0.07)',
					background: '#fff',
					border: '1px solid #e3eaf2',
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					background: 'linear-gradient(90deg, #1976d2 0%, #43a047 100%)',
					boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.10)',
				},
			},
		},
		MuiInputBase: {
			styleOverrides: {
				root: {
					background: '#f7fafd',
					borderRadius: 6,
					padding: '6px 12px',
				},
				input: {
					fontSize: '1rem',
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					background: '#f7fafd',
					borderRadius: 6,
				},
				notchedOutline: {
					borderColor: '#b0b7c3',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					background: '#fff',
				},
			},
		},
        MuiOutlinedInput: {
            styleOverrides: {
                input: {
                    '&:-webkit-autofill': {
                        boxShadow: '0 0 0 100px #e3eaf2 inset',
                        WebkitTextFillColor: '#222b45',
                        transition: 'background-color 5000s ease-in-out 0s',
                    },
                },
            },
        },
	},
});

export default theme;
