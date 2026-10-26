import type { Metadata } from "next";
import { cmsCopy } from "@/components/cms/cms-copy";
import { LoginForm } from "@/components/cms/login-form";

export const metadata: Metadata = { title: cmsCopy.login.title };

export default function CmsLogin() {
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">{cmsCopy.login.title}</h1>
      <LoginForm />
    </>
  );
}
