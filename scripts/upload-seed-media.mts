// Uploads the portfolio seed's cover screenshots to Cloudinary under their
// fixed public IDs (Phase 9 spec, D5, D6). Local only: the API key and secret
// live in the developer's .env.local and nowhere else until Phase 28.
//
//   pnpm media:upload-seed [--from <dir>]   (default ../emo-onerhime/public/projects)
//
// Existing assets are never overwritten, so the script is safe to re-run. To
// replace a cover later, upload it under a new public ID instead.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { parsePortfolioSeed, seedCoverPublicId, seedItemId } from "../lib/portfolio/schema.ts";
import { portfolioSeed } from "../prisma/seed-data/portfolio.ts";

const MAX_BYTES = 15 * 1024 * 1024;

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { values, positionals } = parseArgs({
  options: { from: { type: "string" } },
  allowPositionals: true,
});
const sourceDir = path.resolve(values.from ?? positionals[0] ?? "../emo-onerhime/public/projects");

const envResult = z
  .object({
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().regex(/^\d{6,20}$/),
    CLOUDINARY_API_SECRET: z.string().regex(/^[A-Za-z0-9_-]{10,64}$/),
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

const items = parsePortfolioSeed(portfolioSeed);

// Check every file before uploading any, so a missing one uploads nothing.
const files = items.map((item) => {
  const file = path.join(sourceDir, item.cover.source);
  if (!existsSync(file)) throw new Error(`Missing cover for ${item.slug}: ${file}`);
  const { size } = statSync(file);
  if (size > MAX_BYTES) throw new Error(`Cover for ${item.slug} is over 15 MB: ${file}`);
  return file;
});

console.log(`Cloud ${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}, source ${sourceDir}`);

for (const [index, item] of items.entries()) {
  const publicId = seedCoverPublicId(item.slug);
  const result = await cloudinary.uploader.upload(files[index], {
    public_id: publicId,
    asset_folder: `rhm/portfolio_item/${seedItemId(item.slug)}`,
    display_name: `${item.slug}-cover`,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
    resource_type: "image",
    allowed_formats: ["jpg", "png", "webp", "avif"],
  });
  if (result.public_id !== publicId) {
    throw new Error(`Cloudinary stored ${result.public_id}, expected ${publicId}`);
  }
  const status = (result as { existing?: boolean }).existing ? "exists  " : "uploaded";
  console.log(`${status} ${publicId} ${result.width}x${result.height} ${result.format}`);
}
