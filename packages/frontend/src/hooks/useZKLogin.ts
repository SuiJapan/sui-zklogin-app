import { useCallback, useContext } from "react";
import { GlobalContext } from "../types/globalContext";

/**
 * zkLogin関連の状態とメソッドを使用するためのカスタムフック
 */
export function useZKLogin() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useZKLogin must be used within a GlobalProvider");
  }

  const {
    generateEphemeralKeyPair,
    generateRandomnessValue,
    fetchCurrentEpoch,
  } = context;

  /**
   * Google OAuth を開く直前に必要な値（鍵ペア・エポック・ランダムネス）を生成する。
   * これらがそろうと GlobalProvider 側の useEffect が nonce を作り、OAuth リダイレクトを実行する。
   */
  const startLogin = useCallback(async () => {
    // zkLogin で使い捨てる鍵ペアを生成し、sessionStorage に保持
    generateEphemeralKeyPair();
    // 現在の epoch を取得し、nonce 計算や maxEpoch に使用
    await fetchCurrentEpoch();
    // nonce に混ぜるランダムネスを生成
    generateRandomnessValue();
  }, [generateEphemeralKeyPair, fetchCurrentEpoch, generateRandomnessValue]);

  return {
    startLogin,
  };
}
