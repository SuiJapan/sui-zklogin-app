import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useGlobalContext } from "./../hooks/useGlobalContext";
import { useSui } from "./../hooks/useSui";
import { useZKLogin } from "./../hooks/useZKLogin";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { NFTMintButton } from "./NFTMintButton";
import { TransactionExecuteButton } from "./TransactionExecuteButton";

/**
 * ActionsCard コンポーネント
 */
const ActionsCard = () => {
  const {
    zkLoginUserAddress,
    decodedJwt,
    ephemeralKeyPair,
    userSalt,
    zkProof,
    maxEpoch,
    executingTxn,
    setExecutingTxn,
    setExecuteDigest,
  } = useGlobalContext();

  const { executeTransaction, mintNFT } = useSui();
  const { startLogin } = useZKLogin();

  return (
    <Card elevation={3}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" component="div">
            Actions
          </Typography>
          {!zkLoginUserAddress ? (
            <GoogleLoginButton login={startLogin} />
          ) : (
            <>
              <TransactionExecuteButton
                executingTxn={executingTxn}
                decodedJwt={decodedJwt}
                ephemeralKeyPair={ephemeralKeyPair}
                zkProof={zkProof}
                userSalt={userSalt}
                zkLoginUserAddress={zkLoginUserAddress}
                maxEpoch={maxEpoch}
                executeTransaction={executeTransaction}
                setExecutingTxn={setExecutingTxn}
                setExecuteDigest={setExecuteDigest}
              />
              <NFTMintButton
                executingTxn={executingTxn}
                decodedJwt={decodedJwt}
                ephemeralKeyPair={ephemeralKeyPair}
                zkProof={zkProof}
                userSalt={userSalt}
                zkLoginUserAddress={zkLoginUserAddress}
                maxEpoch={maxEpoch}
                mintNFT={mintNFT}
                setExecutingTxn={setExecutingTxn}
                setExecuteDigest={setExecuteDigest}
              />
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
