import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["avatars"] as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const type = (form.get("type") as string | null) ?? "";

  if (!ALLOWED_TYPES.includes(type as any)) {
    return NextResponse.json({ error: "invalid_upload_type" }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const ext  = extname(file.name) || ".jpg";
  const name = `${randomUUID()}${ext}`;
  const dir  = join(process.cwd(), "public", "uploads", type);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${type}/${name}` });
}
