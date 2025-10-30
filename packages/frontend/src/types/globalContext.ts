import type { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import type { getZkLoginSignature } from "@mysten/zklogin";
import { Session, User } from "@supabase/supabase-js";
import type { JwtPayload } from "jwt-decode";
import type queryString from "query-string";
import { createContext } from "react";

// ZK Login用の署名データの型定義
export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

// Context の型定義
export interface GlobalContextType {
  // State
  currentEpoch: string;
  nonce: string;
  oauthParams: queryString.ParsedQuery<string> | undefined;
  zkLoginUserAddress: string;
  decodedJwt: JwtPayload | undefined;
  jwtString: string;
  ephemeralKeyPair: Ed25519Keypair | undefined;
  userSalt: string | undefined;
  zkProof: PartialZkLoginSignature | undefined;
  extendedEphemeralPublicKey: string;
  maxEpoch: number;
  randomness: string;
  activeStep: number;
  fetchingZKProof: boolean;
  executingTxn: boolean;
  executeDigest: string;
  user: User | null;
  session: Session | null;
  loading: boolean;

  // State setters
  setCurrentEpoch: (value: string) => void;
  setNonce: (value: string) => void;
  setOauthParams: (value: queryString.ParsedQuery<string> | undefined) => void;
  setZkLoginUserAddress: (value: string) => void;
  setDecodedJwt: (value: JwtPayload | undefined) => void;
  setJwtString: (value: string) => void;
  setEphemeralKeyPair: (value: Ed25519Keypair | undefined) => void;
  setUserSalt: (value: string | undefined) => void;
  setZkProof: (value: PartialZkLoginSignature | undefined) => void;
  setExtendedEphemeralPublicKey: (value: string) => void;
  setMaxEpoch: (value: number) => void;
  setRandomness: (value: string) => void;
  setFetchingZKProof: (value: boolean) => void;
  setExecutingTxn: (value: boolean) => void;
  setExecuteDigest: (value: string) => void;
  setUser: (value: User | null) => void;
  setSession: (value: Session | null) => void;
  setLoading: (value: boolean) => void;

  // Methods
  resetState: () => void;
  signOut: () => Promise<void>;
  generateEphemeralKeyPair: () => void;
  clearEphemeralKeyPair: () => void;
  fetchCurrentEpoch: () => Promise<void>;
  generateRandomnessValue: () => void;
  generateNonceValue: () => void;
  generateZkLoginAddress: () => void;
  generateExtendedEphemeralPublicKey: () => void;
}

// Context の作成
export const GlobalContext = createContext<GlobalContextType | undefined>(
  undefined,
);
