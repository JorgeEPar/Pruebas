import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";

// Gate server-side: sin código válido no se renderiza /ideas.
export default async function IdeasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const code = (await cookies()).get(INVITE_COOKIE)?.value ?? "";
  const invite = await validateInvite(code);
  if (!invite) redirect("/acceso");
  return <>{children}</>;
}
