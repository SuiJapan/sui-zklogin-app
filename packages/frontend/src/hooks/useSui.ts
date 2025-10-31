import { useSuiClientQuery } from "@mysten/dapp-kit";
import type { SerializedSignature } from "@mysten/sui.js/cryptography";
import type { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";
import { genAddressSeed, getZkLoginSignature } from "@mysten/zklogin";
import type { JwtPayload } from "jwt-decode";
import { enqueueSnackbar } from "notistack";
import { useCallback } from "react";
import { suiClient } from "../lib/suiClient";
import type { PartialZkLoginSignature } from "../types/globalContext";
import { NFT_PACKAGE_ID } from "../utils/constant";

export interface ExecuteTransactionParams {
  ephemeralKeyPair: Ed25519Keypair;
  zkProof: PartialZkLoginSignature;
  decodedJwt: JwtPayload;
  userSalt: string;
  zkLoginUserAddress: string;
  maxEpoch: number;
  setExecutingTxn: (loading: boolean) => void;
  setExecuteDigest: (digest: string) => void;
}

export interface MintNFTParams {
  ephemeralKeyPair: Ed25519Keypair;
  zkProof: PartialZkLoginSignature;
  decodedJwt: JwtPayload;
  userSalt: string;
  zkLoginUserAddress: string;
  maxEpoch: number;
  name: string;
  description: string;
  imageUrl: string;
  setExecutingTxn: (loading: boolean) => void;
  setExecuteDigest: (digest: string) => void;
}

/**
 * Sui ブロックチェーンに関するReact Hookをまとめたカスタムフック
 * @returns {Object} - Contains the executeTransaction function
 */
export function useSui() {
  /**
   * 送金用のトランザクションを実行するメソッド
   */
  const executeTransaction = useCallback(
    async (params: ExecuteTransactionParams) => {
      const {
        ephemeralKeyPair,
        zkProof,
        decodedJwt,
        userSalt,
        zkLoginUserAddress,
        maxEpoch,
        setExecutingTxn,
        setExecuteDigest,
      } = params;

      try {
        if (!ephemeralKeyPair || !zkProof || !decodedJwt || !userSalt) {
          return;
        }

        setExecutingTxn(true);
        // ガスオブジェクトから送金額を切り出し、検証用アドレスへ送金する TxBlock を構築
        const txb = new TransactionBlock();
        // 送金用の額を指定
        const [coin] = txb.splitCoins(txb.gas, [MIST_PER_SUI * 1n]);
        // 検証用のコインオブジェクトを作成
        txb.transferObjects(
          [coin],
          "0x6c1aa061d0495b71eefd97e7d0a1cef0092f5c64d1b751decdc7b5ad0d039c02",
        );
        txb.setSender(zkLoginUserAddress);

        // トランザクションに署名する
        const { bytes, signature: userSignature } = await txb.sign({
          client: suiClient,
          // ZK Proof で使用したエフェメラル鍵と同じものを使う必要がある
          signer: ephemeralKeyPair,
        });

        if (!decodedJwt?.sub || !decodedJwt.aud) {
          return;
        }

        // salt + JWT の sub / aud からアドレスシードを生成
        const addressSeed: string = genAddressSeed(
          BigInt(userSalt),
          "sub",
          decodedJwt.sub,
          decodedJwt.aud as string,
        ).toString();

        // Prover から受け取った zkProof とアドレスシードを合成し、ZKLogin 署名を生成
        const zkLoginSignature: SerializedSignature = getZkLoginSignature({
          inputs: {
            ...zkProof,
            addressSeed,
          },
          maxEpoch,
          userSignature,
        });

        // トランザクションを送信する
        const executeRes = await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature: zkLoginSignature,
        });

        enqueueSnackbar(`Execution successful: ${executeRes.digest}`, {
          variant: "success",
        });
        setExecuteDigest(executeRes.digest);
      } catch (error) {
        console.error(error);
        enqueueSnackbar(String(error), {
          variant: "error",
        });
      } finally {
        setExecutingTxn(false);
      }
    },
    [],
  );

  /**
   * NFTをミントするメソッド
   */
  const mintNFT = useCallback(async (params: MintNFTParams) => {
    const {
      ephemeralKeyPair,
      zkProof,
      decodedJwt,
      userSalt,
      zkLoginUserAddress,
      maxEpoch,
      name,
      description,
      imageUrl,
      setExecutingTxn,
      setExecuteDigest,
    } = params;

    try {
      if (!ephemeralKeyPair || !zkProof || !decodedJwt || !userSalt) {
        enqueueSnackbar("必要なパラメータが不足しています", {
          variant: "error",
        });
        return;
      }

      if (!name || !description || !imageUrl) {
        enqueueSnackbar("NFTの名前、説明、画像URLを入力してください", {
          variant: "error",
        });
        return;
      }

      setExecutingTxn(true);
      const txb = new TransactionBlock();

      // NFTをミントする関数を呼び出し
      txb.moveCall({
        target: `${NFT_PACKAGE_ID}::testnet_nft::mint_to_sender`,
        arguments: [
          txb.pure.string(name),
          txb.pure.string(description),
          txb.pure.string(imageUrl),
        ],
      });

      txb.setSender(zkLoginUserAddress);

      // 署名済みトランザクションデータを作成する
      const { bytes, signature: userSignature } = await txb.sign({
        client: suiClient,
        signer: ephemeralKeyPair,
      });

      console.log("Transaction bytes:", bytes);

      if (!decodedJwt?.sub || !decodedJwt.aud) {
        enqueueSnackbar("JWT情報が不正です", {
          variant: "error",
        });
        return;
      }

      // 同じ手順でアドレスシードを算出
      const addressSeed: string = genAddressSeed(
        BigInt(userSalt),
        "sub",
        decodedJwt.sub,
        decodedJwt.aud as string,
      ).toString();

      // ZKLogin署名でトランザクションに署名
      const zkLoginSignature: SerializedSignature = getZkLoginSignature({
        inputs: {
          ...zkProof,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });

      // トランザクションを送信する
      const executeRes = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      console.log(`NFTミントが成功しました: ${executeRes.digest}`);

      enqueueSnackbar(`NFTミントが成功しました: ${executeRes.digest}`, {
        variant: "success",
      });
      setExecuteDigest(executeRes.digest);

      return executeRes;
    } catch (error) {
      console.error("NFTミントエラー:", error);
      enqueueSnackbar(`NFTミントに失敗しました: ${String(error)}`, {
        variant: "error",
      });
      throw error;
    } finally {
      setExecutingTxn(false);
    }
  }, []);

  return {
    executeTransaction,
    mintNFT,
  };
}

/**
 * ユーザーの残高を取得するメソッド
 * @param zkLoginUserAddress
 * @returns
 */
export function useGetBalance(zkLoginUserAddress: string) {
  const { data: addressBalance, ...rest } = useSuiClientQuery(
    "getBalance",
    { owner: zkLoginUserAddress },
    {
      enabled: Boolean(zkLoginUserAddress),
      refetchInterval: 1500,
    },
  );
  return { addressBalance, ...rest };
}

/**
 * ユーザーが所有するNFTを取得するメソッド
 */
export function useGetOwnedNFTs(zkLoginUserAddress: string) {
  const { data: ownedObjects, ...rest } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: zkLoginUserAddress,
      filter: {
        StructType: `${NFT_PACKAGE_ID}::testnet_nft::TestnetNFT`,
      },
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      },
    },
    {
      enabled: Boolean(zkLoginUserAddress),
      refetchInterval: 3000,
    },
  );

  return { ownedNFTs: ownedObjects?.data || [], ...rest };
}
