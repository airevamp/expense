import React, { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";

// Placeholder; later call your API to list by blob index tags
export default function Receipts() {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/receipts", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          name: string;
          url: string;
        }[];
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setItems([]);
        }
      }
    })();
    return () => controller.abort();
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
