import { CssBaseline, ThemeProvider } from '@mui/material';
import { BaseDarkTheme } from '@/themes/baseDark';


function App() {
  return (
    <ThemeProvider theme={BaseDarkTheme}>
      <CssBaseline />
      <div>Memoire app</div>
    </ThemeProvider>
  )
}

export default App
