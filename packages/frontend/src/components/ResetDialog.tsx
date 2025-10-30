import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface ResetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * ログアウト用のダイアログコンポーネント
 * @param param0
 * @returns
 */
export function ResetDialog({ open, onClose, onConfirm }: ResetDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: "0 4px 24px #6366f133",
          background: "linear-gradient(90deg, #e0e7ff 0%, #f0fdfa 100%)",
          p: { xs: 2, md: 3 },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.1rem", md: "1.25rem" },
          color: "#6366f1",
        }}
      >
        LogOut
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            fontWeight: 500,
            color: "#334155",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
          }}
        >
          <span style={{ fontWeight: 700, color: "#ef4444" }}>
            ログアウトします
          </span>
          <br />
          本当にログアウトしますか？
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{ borderRadius: 3, px: 3, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            borderRadius: 3,
            px: 3,
            fontWeight: 700,
            boxShadow: "0 1px 8px #ef444433",
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
