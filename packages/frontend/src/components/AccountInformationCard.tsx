import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useGlobalContext } from "../hooks/useGlobalContext";
import { useGetBalance } from "../hooks/useSui";
import { NFTBalance, ShowBalance } from "./Balance";
import { FaucetLinkButton } from "./FaucetLinkButton";

/**
 * AccountInformationCard コンポーネント
 */
const AccountInformationCard = () => {
  const { zkLoginUserAddress } = useGlobalContext();
  const { addressBalance } = useGetBalance(zkLoginUserAddress);

  return (
    <>
      {zkLoginUserAddress && (
        <Card elevation={3}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" component="div">
                Account
              </Typography>
              <ShowBalance
                zkLoginUserAddress={zkLoginUserAddress}
                addressBalance={addressBalance}
              />
              <NFTBalance zkLoginUserAddress={zkLoginUserAddress} />
              <FaucetLinkButton />
            </Stack>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AccountInformationCard;
