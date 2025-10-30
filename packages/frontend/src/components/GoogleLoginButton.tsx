import { Button } from "@mui/material";
import GoogleLogo from "../assets/google.svg";

interface GoogleLoginButtonProps {
  login: () => void;
}

/**
 * GoogloginButton コンポーネント
 * @param param0
 * @returns
 */
export function GoogleLoginButton({ login }: GoogleLoginButtonProps) {
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={login}
      sx={{
        py: 1.5,
        fontSize: "1rem",
        fontWeight: 600,
        borderRadius: 2,
        borderColor: "grey.300",
        color: "text.primary",
        textTransform: "none",
        transition: "all 0.2s",
        ":hover": {
          borderColor: "primary.main",
          bgcolor: "primary.lighter",
        },
      }}
      startIcon={<img src={GoogleLogo} width={24} height={24} alt="Google" />}
    >
      Sign In with Google
    </Button>
  );
}
