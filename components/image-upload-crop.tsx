"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, X, Loader } from "lucide-react";

type Props = {
  name: string;          // hidden input name that receives the uploaded URL
  uploadType: string;    // "characters" | "series" — maps to /public/uploads/[type]/
  aspectRatio?: number;  // default 1 (square for character portraits)
  label?: string;
  currentUrl?: string;   // pre-populate with existing image on edit forms
};

function centerAspectCrop(mediaW: number, mediaH: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaW, mediaH),
    mediaW,
    mediaH,
  );
}

export function ImageUploadCrop({ name, uploadType, aspectRatio = 1, label = "Character Image", currentUrl }: Props) {
  const [src, setSrc]             = useState<string | null>(null);
  const [crop, setCrop]           = useState<Crop>();
  const [preview, setPreview]     = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [url, setUrl]             = useState<string>(currentUrl ?? "");
  const imgRef                    = useRef<HTMLImageElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);
    setUrl("");
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h, aspectRatio));
  }, [aspectRatio]);

  const confirmCrop = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !crop?.width || !crop?.height) return;

    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth  / img.width;
    const scaleY = img.naturalHeight / img.height;

    const pixelCrop = crop.unit === "%" ? {
      x:      (crop.x      / 100) * img.naturalWidth,
      y:      (crop.y      / 100) * img.naturalHeight,
      width:  (crop.width  / 100) * img.naturalWidth,
      height: (crop.height / 100) * img.naturalHeight,
    } : {
      x: crop.x * scaleX, y: crop.y * scaleY,
      width: crop.width * scaleX, height: crop.height * scaleY,
    };

    const size = Math.min(pixelCrop.width, pixelCrop.height, 800);
    canvas.width  = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);

    canvas.toBlob(async (blob) => {
      if (!blob) { setError("Crop failed — try again."); return; }
      setUploading(true);
      setError(null);

      const fd = new FormData();
      fd.append("file", new File([blob], "upload.jpg", { type: "image/jpeg" }));
      fd.append("type", uploadType);

      try {
        const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
        setUrl(json.url);
        setPreview(json.url);
        setSrc(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }, "image/jpeg", 0.9);
  }, [crop, uploadType]);

  const reset = useCallback(() => {
    setSrc(null);
    setPreview(null);
    setUrl("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-ghost)" }}>
        {label}
      </label>

      {/* Hidden URL input — this is what the form reads */}
      <input type="hidden" name={name} value={url} />

      {!src && !preview && (
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "120px",
            border: "2px dashed var(--color-border)",
            borderRadius: "10px",
            cursor: "pointer",
            color: "var(--color-text-ghost)",
            fontSize: "12px",
            fontWeight: 600,
            transition: "border-color 0.2s",
          }}
        >
          <Upload size={20} />
          Click to select image
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </label>
      )}

      {/* Crop UI */}
      {src && !preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ maxHeight: "340px", overflow: "auto", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={aspectRatio}
              circularCrop={false}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", display: "block" }}
              />
            </ReactCrop>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={uploading || !crop?.width}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                background: "var(--color-accent)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {uploading ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</> : "Crop & Upload"}
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uploaded preview */}
      {preview && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded"
            style={{ width: "72px", height: "72px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--color-border)" }}
          />
          <div style={{ flex: 1, fontSize: "12px", color: "var(--color-text-muted)" }}>
            Image uploaded ✓
          </div>
          <button
            type="button"
            onClick={reset}
            aria-label="Remove image"
            style={{ color: "var(--color-text-ghost)", padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>{error}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
