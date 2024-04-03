import type { AppProps } from "next/app";

import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { green, purple } from '@mui/material/colors';
import { CssBaseline } from "@mui/material";

const theme = responsiveFontSizes(createTheme({
  
  palette: {
    mode: 'dark',
    background: {
      default: '#13093c',
      paper: '#1b074f',
    },
    
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        },
      },
    },  
  },
  
  shape: {
    borderRadius: 15,
  },
}));


export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
