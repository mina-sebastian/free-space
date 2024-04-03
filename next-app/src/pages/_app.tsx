import type { AppProps } from "next/app";

import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";

import { Ubuntu } from "next/font/google"

const font = Ubuntu({
  weight: '500',
  subsets: ['latin'],
})

const theme = responsiveFontSizes(createTheme({
  spacing: 5,
  typography: {
    fontFamily: font.style.fontFamily,
  },
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
