import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { LoadingButton } from "@mui/lab";
import type { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import type { JwtPayload } from "jwt-decode";
import type { MintNFTParams } from "../hooks/useSui";
import type { PartialZkLoginSignature } from "../types/globalContext";

interface NFTMintButtonProps {
  executingTxn: boolean;
  decodedJwt: JwtPayload | undefined;
  ephemeralKeyPair: Ed25519Keypair | undefined;
  zkProof: PartialZkLoginSignature | undefined;
  userSalt: string | undefined;
  zkLoginUserAddress: string;
  maxEpoch: number;
  mintNFT: (args: MintNFTParams) => void;
  setExecutingTxn: (v: boolean) => void;
  setExecuteDigest: (v: string) => void;
}

/**
 * NFTミントボタン コンポーネント
 * @param param0
 * @returns
 */
export function NFTMintButton({
  executingTxn,
  decodedJwt,
  ephemeralKeyPair,
  zkProof,
  userSalt,
  zkLoginUserAddress,
  maxEpoch,
  mintNFT,
  setExecutingTxn,
  setExecuteDigest,
}: NFTMintButtonProps) {
  return (
    <LoadingButton
      fullWidth
      loading={executingTxn}
      variant="outlined"
      color="primary"
      disabled={!decodedJwt}
      sx={{
        py: 1.5,
        fontSize: "1rem",
        fontWeight: 600,
        borderRadius: 2,
        textTransform: "none",
      }}
      startIcon={<AutoAwesomeIcon />}
      onClick={() => {
        if (ephemeralKeyPair && zkProof && decodedJwt && userSalt) {
          mintNFT({
            ephemeralKeyPair,
            zkProof,
            decodedJwt,
            userSalt,
            zkLoginUserAddress,
            maxEpoch,
            name: "Sui zkLogin NFT",
            description: "An NFT minted with zkLogin address.",
            imageUrl:
              "https://cdn.prod.website-files.com/6425f546844727ce5fb9e5ab/643820c0755b407a0a603863_sui-logo.svg",
            setExecutingTxn,
            setExecuteDigest,
          });
        }
      }}
    >
      Mint NFT
    </LoadingButton>
  );
}
