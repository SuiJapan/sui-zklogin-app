import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import { createNetworkConfig, SuiClientProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.js";
import { StyledSnackbar } from "./components/StyledSnackbar.js";
import { GlobalProvider } from "./context/GlobalProvider.js";
import "./style/index.css";
import ThemeConfig from "./utils/theme";

// ネットワーク設定を読み込み
const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl(import.meta.env.VITE_SUI_NETWORK_NAME) },
});

const queryClient = new QueryClient();

/**
 * Main application entry point
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <ThemeProvider theme={createTheme(ThemeConfig)}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network="devnet">
          <GlobalProvider>
            <StyledSnackbar maxSnack={4} autoHideDuration={3000} />
            <Routes>
              <Route path="/" element={<App />}></Route>
            </Routes>
            <Analytics />
          </GlobalProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
