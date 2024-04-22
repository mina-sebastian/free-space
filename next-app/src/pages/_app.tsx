import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";

import { Ubuntu } from "next/font/google";
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

const font = Ubuntu({
  weight: '500',
  subsets: ['latin'],
});

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

export default function MyApp({ Component, session, pageProps }: AppProps & { session: any }) {
  const [uppy, setUppy] = useState<Uppy>();

  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensures this code block runs only on the client
      const up = new Uppy()
        .use(Dashboard, { inline: true, target: '#uppy-dashboard' }) // Target must match a div ID in your component
        .use(Tus, { endpoint: 'http://localhost/files/' });
      setUppy(up);

      // Cleanup function to close Uppy on component unmount
      return () => up.close();
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <div id="uppy-dashboard"></div> {/* Add this div to ensure Uppy has a target */}
        <Component uppy={uppy} {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
