import React from "react";
import { Paper, Typography } from "@mui/material";

export default function Profile() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Coming soon.
      </Typography>
    </Paper>
  );
}
