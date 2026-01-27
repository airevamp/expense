import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../lib/auth";

type LocationState = { from?: string };

export default function Login() {
  const { user, loading, login } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const from = state?.from || "/capture";

  React.useEffect(() => {
    if (!loading && user?.userId) {
      navigate(from, { replace: true });
    }
  }, [loading, user?.userId, navigate, from]);

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background: "linear-gradient(140deg, #f2efe9, #f9f4ec 60%, #e9efe7)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 440,
          width: "100%",
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(255,255,255,0.9))",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="overline" sx={{ letterSpacing: 1 }}>
            Expense Vault
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Sign in to continue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secure access to your receipts and uploads. Choose your account to
            proceed.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => login(window.location.origin + from)}
            disabled={loading}
          >
            Sign in with Microsoft
          </Button>
          <Typography variant="caption" color="text.secondary">
            You’ll be redirected to Microsoft to complete sign-in.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
