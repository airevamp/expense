import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Paper,
  Stack,
  Button,
  LinearProgress,
  Alert,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  buildBlobName,
  compressIfPossible,
  getSasUrl,
  getDevAuthHeaders,
  ymd,
} from "../lib/api";
import { useUser } from "../lib/auth";
import { useLoading } from "./LoadingProvider";

export default function CaptureCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<
    "idle" | "prepping" | "uploading" | "tagging" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const { user } = useUser();
  const { start, stop } = useLoading();

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setNotes("");
    setState("idle");
    setMessage("");
  }, []);

  const upload = useCallback(async () => {
    if (!file) return;
    start();
    try {
      setState("prepping");
      const prepared = await compressIfPossible(file);
      const ext = prepared.type.includes("png") ? "png" : "jpg";
      const now = new Date();
      const { y, m } = ymd(now);
      const headers = getDevAuthHeaders({
        org: user?.company,
        teamId: user?.tenantId,
        userId: user?.userId,
      });
      const teamId = headers["x-team-id"] || "acme";
      const userId = headers["x-user-id"] || "user-123";
      const blobName = buildBlobName({
        org: headers["x-org"],
        teamId,
        userId,
        source: "iphone",
        ext,
        now,
      });

      const tags = { teamId, userId, year: String(y), month: String(m) };

      const sas = await getSasUrl(blobName, prepared.type, headers);
      setState("uploading");
      const tagHeader = Object.entries(tags)
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        )
        .join("&");
      const uploadRes = await fetch(sas.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": prepared.type,
          "x-ms-blob-type": "BlockBlob",
          "x-ms-tags": tagHeader,
        },
        body: prepared,
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      setState("done");
      setMessage(sas.blobUrl);
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Upload error");
    } finally {
      stop();
    }
  }, [file, notes, user?.company, user?.tenantId, user?.userId, start, stop]);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      {state === "uploading" && <LinearProgress />}
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Capture a receipt
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderStyle: "dashed",
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Stack spacing={2} alignItems="center">
            {preview ? (
              <img src={preview} style={{ width: "100%", borderRadius: 8 }} />
            ) : (
              <>
                <PhotoCameraIcon fontSize="large" />
                <Typography variant="body2">Opens the camera</Typography>
              </>
            )}
            <Button
              component="label"
              startIcon={<PhotoCameraIcon />}
              variant="contained"
              size="large"
            >
              Take / Choose Photo
              <input
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPick}
              />
            </Button>
          </Stack>
        </Paper>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          disabled={
            !file ||
            state === "prepping" ||
            state === "uploading" ||
            state === "tagging"
          }
          onClick={upload}
          fullWidth
          size="large"
        >
          Upload to Blob
        </Button>
        <Button
          variant="text"
          color="inherit"
          startIcon={<DeleteIcon />}
          onClick={reset}
          fullWidth
        >
          Reset
        </Button>
      </CardActions>

      {state === "tagging" && <LinearProgress />}

      {state === "done" && (
        <Paper sx={{ p: 2, m: 2, borderRadius: 2 }} variant="outlined">
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircleIcon color="success" />
            <Typography variant="body2">Uploaded</Typography>
          </Stack>
          <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
            {message}
          </Typography>
        </Paper>
      )}

      {state === "error" && (
        <Alert severity="error" sx={{ m: 2 }}>
          {message}
        </Alert>
      )}
    </Card>
  );
}
