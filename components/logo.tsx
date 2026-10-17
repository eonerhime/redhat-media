import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/logo.png";

// Light-on-dark variant of the owner's logo, the one image outside <MediaImage> (Phase 1 spec, D1
// as amended 2026-10-14). Eager, not preloaded: it is above the fold but not the LCP element.
export function Logo() {
  return (
    <Link href="/" className="inline-flex shrink-0">
      <Image
        src={logo}
        alt="RedHat Media home"
        width={98}
        height={56}
        loading="eager"
        className="h-12 w-auto md:h-14"
      />
    </Link>
  );
}
