import SendIcon from "@mui/icons-material/Send";
import { LoadingButton } from "@mui/lab";
import type { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import type { JwtPayload } from "jwt-decode";
import type { ExecuteTransactionParams } from "../hooks/useSui";
import type { PartialZkLoginSignature } from "../types/globalContext";

interface TransactionExecuteButtonProps {
  executingTxn: boolean;
  decodedJwt: JwtPayload | undefined;
  ephemeralKeyPair: Ed25519Keypair | undefined;
  zkProof: PartialZkLoginSignature | undefined;
  userSalt: string | undefined;
  zkLoginUserAddress: string;
  maxEpoch: number;
  executeTransaction: (args: ExecuteTransactionParams) => void;
  setExecutingTxn: (v: boolean) => void;
  setExecuteDigest: (v: string) => void;
}

export function TransactionExecuteButton({
  executingTxn,
  decodedJwt,
  ephemeralKeyPair,
  zkProof,
  userSalt,
  zkLoginUserAddress,
  maxEpoch,
  executeTransaction,
  setExecutingTxn,
  setExecuteDigest,
}: TransactionExecuteButtonProps) {
  return (
    <LoadingButton
      fullWidth
      loading={executingTxn}
      variant="contained"
      color="primary"
      disabled={!decodedJwt}
      sx={{
        py: 1.5,
        fontSize: "1rem",
        fontWeight: 600,
        borderRadius: 2,
        textTransform: "none",
      }}
      startIcon={<SendIcon />}
      onClick={() => {
        if (ephemeralKeyPair && zkProof && decodedJwt && userSalt) {
          executeTransaction({
            ephemeralKeyPair,
            zkProof,
            decodedJwt,
            userSalt,
            zkLoginUserAddress,
            maxEpoch,
            setExecutingTxn,
            setExecuteDigest,
          });
        }
      }}
    >
      Execute Transaction
    </LoadingButton>
  );
}
