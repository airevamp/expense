import React from "react";
import { Paper, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Overview coming soon.
      </Typography>
    </Paper>
  );
}
