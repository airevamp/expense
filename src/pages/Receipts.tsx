import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { getDevAuthHeaders } from "../lib/api";
import { useUser } from "../lib/auth";

// Placeholder; later call your API to list by blob index tags
export default function Receipts() {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  const { user } = useUser();
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/receipts", {
          signal: controller.signal,
          headers: getDevAuthHeaders({
            org: user?.company,
            teamId: user?.tenantId,
            userId: user?.userId,
          }),
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
  }, [user?.company, user?.tenantId, user?.userId]);

  const rows = useMemo(
    () =>
      items.map((item) => {
        const match = item.url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        const date = match ? `${match[1]}-${match[2]}-${match[3]}` : "—";
        return { ...item, date };
      }),
    [items],
  );

  const onDelete = React.useCallback((url: string) => {
    setDeleting((prev) => new Set(prev).add(url));
    setItems((prev) => prev.filter((item) => item.url !== url));
    setDeleting((prev) => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        My Receipts
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.url} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <IconButton
                    component="a"
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                    aria-label="Download"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Delete"
                    onClick={() => onDelete(row.url)}
                    disabled={deleting.has(row.url)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 4, color: "text.secondary" }}>
                  No receipts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
