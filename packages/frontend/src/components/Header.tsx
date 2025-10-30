import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import SuiLogo from "../assets/sui-logo-color.svg";
import { useGlobalContext } from "../hooks/useGlobalContext";
import { ResetDialog } from "./../components/ResetDialog";

/**
 * ヘッダーコンポーネント
 * @returns
 */
export const Header = () => {
  const { zkLoginUserAddress, signOut } = useGlobalContext();
  const [showResetDialog, setShowResetDialog] = useState(false);

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Stack direction="row" alignItems="center" spacing={2}>
          <img src={SuiLogo} alt="Sui" width={30} height={30} />
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            zkLogin Demo App
          </Typography>
          <Typography variant="h6" component="div">
            🛜 {import.meta.env.VITE_SUI_NETWORK_NAME}
          </Typography>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        {zkLoginUserAddress && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setShowResetDialog(true)}
          >
            Sign Out
          </Button>
        )}
        {/* ログアウト用のダイアログコンポーネント */}
        <ResetDialog
          open={showResetDialog}
          onClose={() => setShowResetDialog(false)}
          onConfirm={() => {
            signOut();
            setShowResetDialog(false);
          }}
        />
      </Toolbar>
    </AppBar>
  );
};
