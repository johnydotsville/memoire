import { CssBaseline, ThemeProvider } from '@mui/material';
import { BaseDarkTheme } from '@/themes/baseDark';
import { Test } from './Test';

function App() {
  return (
    <ThemeProvider theme={BaseDarkTheme}>
      <CssBaseline />
      <Test />
    </ThemeProvider>
  )
}

export default App
