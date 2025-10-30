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
   * Starts the zkLogin process by generating the necessary initial values.
   * The rest of the flow is handled by useEffects in GlobalProvider.
   */
  const startLogin = useCallback(async () => {
    // 一時鍵ペア、エポック数取得、ランダムネス生成を行う
    generateEphemeralKeyPair();
    await fetchCurrentEpoch();
    generateRandomnessValue();
  }, [generateEphemeralKeyPair, fetchCurrentEpoch, generateRandomnessValue]);

  return {
    startLogin,
  };
}
