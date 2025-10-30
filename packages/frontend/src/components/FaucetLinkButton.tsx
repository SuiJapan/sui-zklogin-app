import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { Button } from "@mui/material";
import { SUI_DEVNET_FAUCET } from "../utils/constant";

/**
 * FaucetLinkButton コンポーネント
 * @returns
 */
export function FaucetLinkButton() {
  return (
    <Button
      fullWidth
      variant="outlined"
      color="secondary"
      href={SUI_DEVNET_FAUCET}
      target="_blank"
      rel="noopener noreferrer"
      startIcon={<WaterDropIcon />}
      sx={{
        py: 1.5,
        fontSize: "1rem",
        fontWeight: 600,
        borderRadius: 2,
        textTransform: "none",
      }}
    >
      Get SUI from Faucet
    </Button>
  );
}
