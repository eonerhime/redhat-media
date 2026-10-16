import { Archivo, Inter } from "next/font/google";

// Self-hosted at build time, so the CSP keeps font-src 'self' (Phase 1 spec, D2). Shared by the root
// layout and global-error, which replaces it (Phase 15 spec, D2).
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--font-archivo" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const fontVariables = `${archivo.variable} ${inter.variable}`;
