import React, { Suspense } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Button,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useNavigate, useRoutes, Link as RouterLink } from "react-router-dom";
import { routes } from "./routes";

export default function App() {
  const element = useRoutes(routes);
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
          >
            <ReceiptLongIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Receipt Capture
          </Typography>
          <Button color="inherit" component={RouterLink} to="/receipts">
            My Receipts
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Suspense fallback={<div>Loading…</div>}>{element}</Suspense>
      </Container>
    </>
  );
}
