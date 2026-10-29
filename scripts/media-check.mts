// Prints whether Cloudinary still holds each public ID, through the Admin API `resource` call
// (Phase 28 spec, D14): after a replace on the preview, the old upload should be gone. Local only,
// with the developer's key in .env.local. It reads; it never uploads or deletes.
//
//   pnpm media:check <publicId> [<publicId> …]

import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { isRhmPublicId } from "../lib/media/cloudinary.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { positionals } = parseArgs({ allowPositionals: true });
if (positionals.length === 0) throw new Error("Usage: pnpm media:check <publicId> [<publicId> …]");
for (const id of positionals) {
  if (!isRhmPublicId(id)) throw new Error(`Not an rhm/… public ID: ${id}`);
}

const envResult = z
  .object({
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().regex(/^\d{6,30}$/),
    CLOUDINARY_API_SECRET: z.string().min(10).max(200),
  })
  .safeParse(process.env);
if (!envResult.success) {
  // Names only: never print a value.
  const names = [...new Set(envResult.error.issues.map((issue) => issue.path.join(".")))];
  throw new Error(`Set these in .env.local (see .env.example): ${names.join(", ")}`);
}
const env = envResult.data;

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

let failed = false;
for (const id of positionals) {
  try {
    const found = await cloudinary.api.resource(id, { resource_type: "image" });
    console.log(`exists     ${id} (${found.format}, ${found.bytes} bytes, ${found.created_at})`);
  } catch (error) {
    const inner = (error as { error?: { http_code?: number; message?: string } }).error;
    if (inner?.http_code === 404) {
      console.log(`not found  ${id}`);
    } else {
      failed = true;
      console.error(`error      ${id}: ${inner?.message ?? String(error)}`);
    }
  }
}
if (failed) process.exitCode = 1;
