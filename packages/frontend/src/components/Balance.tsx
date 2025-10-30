import { Divider, Stack, Tooltip, Typography } from "@mui/material";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";
import { BigNumber } from "bignumber.js";
import { useSnackbar } from "notistack";
import { useGetOwnedNFTs } from "../hooks/useSui";

interface ShowBalanceProps {
  zkLoginUserAddress: string;
  addressBalance?: {
    totalBalance: string;
  };
}

/**
 * Helper to shorten the address method
 * @param address
 * @returns
 */
const shortenAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * ShowBalance コンポーネント
 * @param param0
 * @returns
 */
export function ShowBalance({
  zkLoginUserAddress,
  addressBalance,
}: ShowBalanceProps) {
  const { enqueueSnackbar } = useSnackbar();

  if (!zkLoginUserAddress) return null;

  /**
   * ウォレットアドレスをクリップボードにコピーするメソッド
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(zkLoginUserAddress);
    enqueueSnackbar("Copied to clipboard!", { variant: "success" });
  };

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Your zkLogin Address
      </Typography>
      <Tooltip title="Copy to clipboard" placement="top">
        <Typography
          onClick={handleCopy}
          sx={{
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: "pointer",
            wordBreak: "break-all",
          }}
        >
          {shortenAddress(zkLoginUserAddress)}
        </Typography>
      </Tooltip>
      <Divider sx={{ my: 1 }} />
      {addressBalance && (
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body1" color="text.secondary">
            SUI Balance:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {BigNumber(addressBalance?.totalBalance)
              .div(MIST_PER_SUI.toString())
              .toFixed(4)}{" "}
            SUI
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * NFT Balance コンポーネント
 * @param param0
 * @returns
 */
export function NFTBalance({
  zkLoginUserAddress,
}: {
  zkLoginUserAddress: string;
}) {
  // NFTの残高を取得する
  const { ownedNFTs } = useGetOwnedNFTs(zkLoginUserAddress);
  if (!zkLoginUserAddress) return null;

  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body1" color="text.secondary">
        Test NFT Balance:
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        {ownedNFTs.length} NFT(s)
      </Typography>
    </Stack>
  );
}
