import React, { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";

// Placeholder; later call your API to list by blob index tags
export default function Receipts() {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  useEffect(() => {
    setItems([]); // TODO: fetch from /api/receipts
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        My Receipts
      </Typography>
      <List>
        {items.map((i) => (
          <ListItem
            key={i.url}
            component="a"
            href={i.url}
            target="_blank"
            divider
          >
            <ListItemText primary={i.name} secondary={i.url} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
