import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  LinearProgress,
  Alert,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  getSasUrl,
  setBlobTags,
  buildBlobName,
  compressIfPossible,
  ymd,
  toISO,
} from "../lib/api";

export default function CaptureCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<
    "idle" | "prepping" | "uploading" | "tagging" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const teamId = "acme";
  const userId = "user-123";

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
    try {
      setState("prepping");
      const prepared = await compressIfPossible(file);
      const ext = prepared.type.includes("png") ? "png" : "jpg";
      const now = new Date();
      const { y, m } = ymd(now);
      const blobName = buildBlobName({
        teamId,
        userId,
        source: "iphone",
        ext,
        now,
      });

      const metadata = {
        captureTs: toISO(now),
        uploadedBy: userId,
        device: navigator.userAgent,
        appVersion: "web-1",
        ocrStatus: "pending",
        notes: notes.slice(0, 200),
      };
      const tags = { teamId, userId, year: String(y), month: String(m) };

      const { uploadUrl, blobUrl } = await getSasUrl(
        blobName,
        prepared.type || "image/jpeg"
      );

      setState("uploading");
      const headers: Record<string, string> = {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": prepared.type || "image/jpeg",
        "x-ms-version": "2021-08-06",
      };
      Object.entries(metadata).forEach(
        ([k, v]) => (headers[`x-ms-meta-${k}`] = v)
      );

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: prepared,
      });
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);

      setState("tagging");
      await setBlobTags(uploadUrl, tags);

      setState("done");
      setMessage(blobUrl);
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Upload error");
    }
  }, [file, notes]);

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
                <Typography variant="body2">
                  iPhone-friendly: opens the camera
                </Typography>
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
          disabled={!file || state === "uploading" || state === "tagging"}
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
