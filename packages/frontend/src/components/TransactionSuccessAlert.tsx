import { Alert, Typography } from "@mui/material";
import { useGlobalContext } from "../hooks/useGlobalContext";

/**
 * TransactionSuccessAlert コンポーネント
 * @param param0
 * @returns
 */
export function TransactionSuccessAlert() {
  const { executeDigest } = useGlobalContext();

  if (!executeDigest) {
    return null;
  }

  return (
    <Alert
      severity="success"
      sx={{
        mt: 2,
        borderRadius: 3,
        boxShadow: "0 2px 12px #22c55e33",
        background: "linear-gradient(90deg, #bbf7d0 0%, #e0e7ff 100%)",
        color: "#166534",
        fontWeight: 600,
        fontSize: { xs: "1rem", md: "1.1rem" },
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      Execution successful:{" "}
      <Typography
        component="span"
        sx={{
          fontFamily: "'Noto Sans Mono', monospace;",
          fontWeight: 700,
          color: "#2563eb",
          ml: 1,
        }}
      >
        <a
          href={`https://suiexplorer.com/txblock/${executeDigest}?network=${import.meta.env.VITE_SUI_NETWORK_NAME}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "underline",
            color: "#2563eb",
            fontWeight: 700,
          }}
        >
          {executeDigest}
        </a>
      </Typography>
    </Alert>
  );
}
