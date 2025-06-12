import { createTheme } from '@mui/material/styles';

export const BaseDarkTheme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // backgroundColor: '#282A36', // Для светлой темы
          // Или динамически через тему:
          // backgroundColor: (theme) => theme.palette.background.default,
        },
      },
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#8BAD4E'
    },
    secondary: {
      main: '#8BAD4E'
    },
    background: {
      default: '#343632',
    },
  },
});