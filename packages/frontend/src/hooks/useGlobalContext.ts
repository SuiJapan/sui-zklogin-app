import { useContext } from "react";
import type { GlobalContextType } from "../types/globalContext";
import { GlobalContext } from "../types/globalContext";

/**
 * Global Context を使用するためのカスタムフック
 */
export function useGlobalContext(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
}
