import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
} from "@mysten/zklogin";
import axios from "axios";
import { Buffer } from "buffer";
import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import { enqueueSnackbar } from "notistack";
import queryString from "query-string";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { suiClient } from "../lib/suiClient";
// Supabase依存を廃止（サーバ側HKDFへ切替）
import type {
  GlobalContextType,
  PartialZkLoginSignature,
} from "../types/globalContext";
import { GlobalContext } from "../types/globalContext";
import {
  CLIENT_ID,
  KEY_PAIR_SESSION_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  REDIRECT_URI,
  SUI_PROVER_DEV_ENDPOINT,
} from "../utils/constant";

// Provider Props の型定義
interface GlobalProviderProps {
  children: ReactNode;
}

/**
 * Global Provider コンポーネント
 * zkLogin関連の共通状態とロジックを管理
 */
export function GlobalProvider({ children }: GlobalProviderProps) {
  // State
  const [currentEpoch, setCurrentEpoch] = useState("");
  const [nonce, setNonce] = useState("");
  const [oauthParams, setOauthParams] =
    useState<queryString.ParsedQuery<string>>();
  const [zkLoginUserAddress, setZkLoginUserAddress] = useState("");
  const [decodedJwt, setDecodedJwt] = useState<JwtPayload>();
  const [jwtString, setJwtString] = useState("");
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
  const [userSalt, setUserSalt] = useState<string>();
  const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
  const [extendedEphemeralPublicKey, setExtendedEphemeralPublicKey] =
    useState("");
  const [maxEpoch, setMaxEpoch] = useState(0);
  const [randomness, setRandomness] = useState("");
  const [activeStep] = useState(0);

  // Supabase依存を削除
  const [fetchingZKProof, setFetchingZKProof] = useState(false);
  const [executingTxn, setExecutingTxn] = useState(false);
  const [executeDigest, setExecuteDigest] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  /**
   * 一時的な鍵ペアを生成するメソッド
   */
  const generateEphemeralKeyPair = () => {
    const newEphemeralKeyPair = Ed25519Keypair.generate();
    // リダイレクト後にも保持するためにセッションストレージに保管
    window.sessionStorage.setItem(
      KEY_PAIR_SESSION_STORAGE_KEY,
      newEphemeralKeyPair.export().privateKey,
    );
    setEphemeralKeyPair(newEphemeralKeyPair);
  };

  /**
   * 一時的な鍵ペアをクリアするメソッド
   */
  const clearEphemeralKeyPair = () => {
    window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
    setEphemeralKeyPair(undefined);
  };

  /**
   * 現在のエポックを取得するメソッド
   */
  const fetchCurrentEpoch = async () => {
    // Sui ClientのgetLatestSuiSystemStateメソッドを呼び出す
    const { epoch } = await suiClient.getLatestSuiSystemState();
    setCurrentEpoch(epoch);
    setMaxEpoch(Number(epoch) + 10);
  };

  /**
   * ランダムネス値を生成するメソッド
   */
  const generateRandomnessValue = () => {
    const newRandomness = generateRandomness();
    // リダイレクト後にも保持するためにセッションストレージに保管
    window.sessionStorage.setItem(
      RANDOMNESS_SESSION_STORAGE_KEY,
      newRandomness,
    );
    setRandomness(newRandomness);
  };

  /**
   * ナンス値を生成するメソッド
   * @returns
   */
  const generateNonceValue = () => {
    if (!ephemeralKeyPair) return;
    const newNonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness,
    );
    setNonce(newNonce);
  };

  useEffect(() => {
    // セッションストレージから一時鍵ペアのデータを取得
    const keypairFromSession = window.sessionStorage.getItem(
      KEY_PAIR_SESSION_STORAGE_KEY,
    );
    if (keypairFromSession) {
      const secretKey = Buffer.from(keypairFromSession, "base64");
      const newEphemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKey);
      setEphemeralKeyPair(newEphemeralKeyPair);
    }

    // セッションストレージからランダムネスの値を取得する
    const randomnessFromSession = window.sessionStorage.getItem(
      RANDOMNESS_SESSION_STORAGE_KEY,
    );
    if (randomnessFromSession) {
      setRandomness(randomnessFromSession);
    }
  }, []);

  // nonce生成: 鍵ペア・maxEpoch・randomnessが揃ったら自動生成
  useEffect(() => {
    const hasIdToken = window.location.hash.includes("id_token=");
    if (!hasIdToken && ephemeralKeyPair && maxEpoch && randomness) {
      // ナンスを生成する
      const newNonce = generateNonce(
        ephemeralKeyPair.getPublicKey(),
        maxEpoch,
        randomness,
      );
      setNonce(newNonce);
    }
  }, [ephemeralKeyPair, maxEpoch, randomness]);

  // Google OAuthリダイレクト: nonceが生成されたら自動実行
  useEffect(() => {
    // id_tokenパラメータが含まれているか確認nする。
    const hasIdToken = window.location.hash.includes("id_token=");
    // 含まれていない場合は / にリダイレクトする
    if (!hasIdToken && nonce && window.location.pathname === "/") {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "id_token",
        scope: "openid",
        nonce: nonce,
      });
      // ログインURLを生成してリダイレクトする
      const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      // 新しいウィンドウでOAuthプロバイダー側の認証処理を行う。
      window.location.replace(loginURL);
    }
  }, [nonce]);

  // ZKLoginアドレス生成: jwtStringとuserSaltが揃ったら自動生成
  useEffect(() => {
    if (jwtString && userSalt) {
      // JWTとユーザーソルトを使ってZKLogin 用のウォレットアドレスを生成
      const zkLoginAddress = jwtToAddress(jwtString, userSalt);
      setZkLoginUserAddress(zkLoginAddress);
    }
  }, [jwtString, userSalt]);

  /**
   * ephemeralKeyPairがセットされたら拡張公開鍵を自動生成するコールバック関数
   */
  const generateExtendedEphemeralPublicKeyCallback = useCallback(() => {
    if (!ephemeralKeyPair) return;
    // 拡張公開鍵を生成
    const extendedKey = getExtendedEphemeralPublicKey(
      ephemeralKeyPair.getPublicKey(),
    );
    setExtendedEphemeralPublicKey(extendedKey);
  }, [ephemeralKeyPair]);

  useEffect(() => {
    if (ephemeralKeyPair) {
      generateExtendedEphemeralPublicKeyCallback();
    }
  }, [ephemeralKeyPair, generateExtendedEphemeralPublicKeyCallback]);

  // ephemeralKeyPairがセットされたら拡張公開鍵を自動生成
  useEffect(() => {
    if (ephemeralKeyPair) {
      generateExtendedEphemeralPublicKeyCallback();
    }
  }, [ephemeralKeyPair, generateExtendedEphemeralPublicKeyCallback]);

  /**
   * ZKProof自動取得するコールバック関数
   * 必要な情報が揃ったらfetchZkProofを呼び出す
   */
  const fetchZkProofCallback = useCallback(async () => {
    if (
      jwtString &&
      userSalt &&
      maxEpoch &&
      ephemeralKeyPair &&
      extendedEphemeralPublicKey &&
      randomness
    ) {
      setFetchingZKProof(true);

      try {
        // ZK Prover APIにリクエストを送信してZKProofを生成する
        const zkProofResult = await axios.post(
          SUI_PROVER_DEV_ENDPOINT,
          {
            // JWT、拡張公開鍵、エポック数、ランダムネス、ユーザーソルトを詰めてAPIを呼び出す
            jwt: oauthParams?.id_token as string,
            extendedEphemeralPublicKey,
            maxEpoch,
            jwtRandomness: randomness,
            salt: userSalt,
            keyClaimName: "sub",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        setZkProof(zkProofResult.data as PartialZkLoginSignature);
      } catch (error) {
        console.error(error);
      } finally {
        setFetchingZKProof(false);
      }
    }
  }, [
    jwtString,
    userSalt,
    maxEpoch,
    ephemeralKeyPair,
    extendedEphemeralPublicKey,
    randomness,
    oauthParams,
  ]);

  useEffect(() => {
    console.log("ZKProof auto-fetch check:", {
      jwtString: !!jwtString,
      userSalt: !!userSalt,
      maxEpoch,
      ephemeralKeyPair: !!ephemeralKeyPair,
      extendedEphemeralPublicKey: !!extendedEphemeralPublicKey,
      randomness: !!randomness,
      zkProof: !!zkProof,
    });

    if (
      jwtString &&
      userSalt &&
      maxEpoch &&
      ephemeralKeyPair &&
      extendedEphemeralPublicKey &&
      randomness &&
      !zkProof
    ) {
      console.log("Triggering ZKProof fetch...");
      fetchZkProofCallback();
    }
  }, [
    jwtString,
    userSalt,
    maxEpoch,
    ephemeralKeyPair,
    extendedEphemeralPublicKey,
    randomness,
    zkProof,
    fetchZkProofCallback,
  ]);

  // Supabaseのセッション監視は廃止

  /**
   * zkLoginデータをSupabaseに保存する関数
   * @param userId
   * @returns
   */
  // Supabase保存は廃止

  /**
   * zkLoginデータをSupabaseから取得する関数
   * @param userId
   * @returns
   */
  // Supabase取得は廃止

  // Location の監視（OAuth パラメータの取得）
  useEffect(() => {
    const res = queryString.parse(location.hash.replace(/^#/, ""));
    setOauthParams(res);
  }, [location]);

  // JWT トークンの処理
  useEffect(() => {
    /**
     * zkLoginの認証処理に必要なデータを処理するためのメソッド
     * @param userId
     */
    const initializeZkLoginData = async () => {
      try {
        // バックエンドのHKDFから salt を取得
        const token = oauthParams?.id_token as string;
        const res = await axios.post<{ salt: string }>("/hkdf", { token });
        const rawSalt = res.data.salt;
        // HKDFがhexを返す場合に備えて10進文字列へ正規化
        const normalizedSalt = /^[0-9a-fA-F]+$/.test(rawSalt)
          ? BigInt(`0x${rawSalt}`).toString()
          : String(rawSalt);
        setUserSalt(normalizedSalt);
        // maxEpoch は最新エポックに基づき計算
        const { epoch } = await suiClient.getLatestSuiSystemState();
        setMaxEpoch(Number(epoch) + 10);
      } catch (error) {
        console.error("Failed to initialize zkLogin data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        enqueueSnackbar(`Failed to initialize zkLogin data: ${errorMessage}`, {
          variant: "error",
        });
      }
    };

    if (oauthParams?.id_token) {
      // 既存のJWTデコード処理など
      const decodedJwt = jwtDecode(oauthParams.id_token as string);
      setJwtString(oauthParams.id_token as string);
      setDecodedJwt(decodedJwt);

      console.log("Decoded JWT:", decodedJwt);

      // salt はバックエンドHKDFから取得
      initializeZkLoginData();
    }
  }, [oauthParams]);

  /**
   * ログアウトしてステート変数の値をリセットするメソッド
   */
  const resetState = () => {
    setCurrentEpoch("");
    setNonce("");
    setOauthParams(undefined);
    setZkLoginUserAddress("");
    setDecodedJwt(undefined);
    setJwtString("");
    setEphemeralKeyPair(undefined);
    setUserSalt(undefined);
    setZkProof(undefined);
    setExtendedEphemeralPublicKey("");
    setMaxEpoch(0);
    setRandomness("");
    0;
    setFetchingZKProof(false);
    setExecutingTxn(false);
    setExecuteDigest("");
  };

  /**
   * signOutするための関数
   */
  const signOut = async () => {
    // stateのリセット
    resetState();
    // sessionStorageのクリア
    window.sessionStorage.clear();
    navigate("/");
  };

  /**
   * JWTからウォレットアドレレスを生成するメソッド
   * @returns
   */
  const generateZkLoginAddress = () => {
    if (!userSalt || !jwtString) return;

    // JWTからウォレットアドレスを生成
    const zkLoginAddress = jwtToAddress(jwtString, userSalt);
    console.log("ZKLoginAddress:", zkLoginAddress);
    setZkLoginUserAddress(zkLoginAddress);
  };

  // GlobalContextProviderから提供する変数・メソッド一覧を定義
  const contextValue: GlobalContextType = {
    // State
    currentEpoch,
    nonce,
    oauthParams,
    zkLoginUserAddress,
    decodedJwt,
    jwtString,
    ephemeralKeyPair,
    userSalt,
    zkProof,
    extendedEphemeralPublicKey,
    maxEpoch,
    randomness,
    activeStep,
    fetchingZKProof,
    executingTxn,
    executeDigest,
    // Supabase由来の state は削除済み

    // State setters
    setCurrentEpoch,
    setNonce,
    setOauthParams,
    setZkLoginUserAddress,
    setDecodedJwt,
    setJwtString,
    setEphemeralKeyPair,
    setUserSalt,
    setZkProof,
    setExtendedEphemeralPublicKey,
    setMaxEpoch,
    setRandomness,
    setFetchingZKProof,
    setExecutingTxn,
    setExecuteDigest,
    // Supabase由来の setters は削除済み

    // Methods
    resetState,
    signOut,
    generateEphemeralKeyPair,
    clearEphemeralKeyPair,
    fetchCurrentEpoch,
    generateRandomnessValue,
    generateNonceValue,
    generateZkLoginAddress,
    generateExtendedEphemeralPublicKey:
      generateExtendedEphemeralPublicKeyCallback,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
