import { SuiClient } from "@mysten/sui.js/client";
import { FULLNODE_URL } from "../utils/constant";

// Sui Clientの初期化（全プロジェクト共通で利用）
export const suiClient = new SuiClient({ url: FULLNODE_URL });
