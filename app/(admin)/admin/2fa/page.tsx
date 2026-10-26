import type { Metadata } from "next";
import { cmsCopy } from "@/components/cms/cms-copy";
import { TwoFactorForm } from "@/components/cms/two-factor-form";

export const metadata: Metadata = { title: cmsCopy.twoFactor.title };

export default function AdminTwoFactor() {
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">{cmsCopy.twoFactor.title}</h1>
      <TwoFactorForm />
    </>
  );
}
