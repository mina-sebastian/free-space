import type { AppProps } from "next/app";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";

import { Ubuntu } from "next/font/google";
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient(); // Create a new instance of QueryClient

const font = Ubuntu({ // Define the Ubuntu font
  weight: '500',
  subsets: ['latin'],
});

const theme = responsiveFontSizes(createTheme({ // Create a responsive theme with Ubuntu font
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
  components: { // Customize the MUI components
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

export default function MyApp({ Component, session, pageProps }: AppProps & { session: any }) {

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <Component {...pageProps} />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
