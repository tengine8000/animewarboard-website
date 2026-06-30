"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, Loader } from "lucide-react";
import { updateAvatarAction } from "@/app/actions/update-avatar";

function centerAspectCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 1, w, h), w, h);
}

export function AvatarUploadModal({
  initialUrl,
  initial,
  rankColor,
}: {
  initialUrl: string | null;
  initial: string;
  rankColor: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl);
  const [src, setSrc]             = useState<string | null>(null);
  const [crop, setCrop]           = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef  = useRef<HTMLImageElement>(null);

  const openPicker = () => fileRef.current?.click();

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h));
  }, []);

  const discard = useCallback(() => {
    setSrc(null);
    setCrop(undefined);
    setError(null);
  }, []);

  const save = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !crop?.width || !crop?.height) return;

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
    const canvas = document.createElement("canvas");
    canvas.width  = size;
    canvas.height = size;
    canvas.getContext("2d")!.drawImage(
      img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size,
    );

    canvas.toBlob(async (blob) => {
      if (!blob) { setError("Crop failed — try again."); return; }
      setUploading(true);
      setError(null);

      const fd = new FormData();
      fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      fd.append("type", "avatars");

      try {
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");

        const uploadedUrl = json.url as string;

        const savefd = new FormData();
        savefd.append("imageUrl", uploadedUrl);
        await updateAvatarAction(savefd);

        setAvatarUrl(uploadedUrl);
        setSrc(null);
        setCrop(undefined);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }, "image/jpeg", 0.9);
  }, [crop]);

  return (
    <>
      {/* Avatar + button */}
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-black"
              style={{ background: rankColor }}
            >
              {initial}
            </div>
          )}
          {/* Camera overlay trigger */}
          <button
            type="button"
            onClick={openPicker}
            aria-label={avatarUrl ? "Update avatar" : "Add avatar"}
            className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-6 h-6 rounded-full text-white"
            style={{ background: "var(--color-accent)", border: "2px solid var(--color-bg)" }}
          >
            <Camera size={10} />
          </button>
        </div>

        <button
          type="button"
          onClick={openPicker}
          className="text-[10px] font-black tracking-widest uppercase"
          style={{ color: "var(--color-accent)" }}
        >
          {avatarUrl ? "Update Avatar" : "Add Avatar"}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Crop modal */}
      {src && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl p-5"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p
              className="text-[10px] font-black tracking-widest uppercase"
              style={{ color: "var(--color-text-ghost)" }}
            >
              Crop your photo
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflow: "auto",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
              }}
            >
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1} circularCrop={false}>
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

            {error && (
              <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={uploading || !crop?.width}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
                style={{ background: "var(--color-accent)" }}
              >
                {uploading
                  ? <><Loader size={13} className="animate-spin" /> Saving…</>
                  : "Save"}
              </button>
              <button
                type="button"
                onClick={discard}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-opacity"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
