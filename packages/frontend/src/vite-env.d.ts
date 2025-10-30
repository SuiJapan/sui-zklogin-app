/// <reference types="vite/client" />

type SuiNetwork = "devnet" | "mainnet" | "testnet" | "localnet";

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_SUI_FULLNODE_URL: string;
  readonly VITE_SUI_DEVNET_FAUCET: string;
  readonly VITE_SUI_PROVER_DEV_ENDPOINT: string;
  readonly VITE_REDIRECT_URI: string;
  readonly VITE_SUI_NETWORK_NAME: SuiNetwork;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
