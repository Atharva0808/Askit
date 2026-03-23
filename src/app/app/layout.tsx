import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // One-trip parallelization of auth and data fetch (relying on Supabase RLS for filtering)
  const [userRes, chatsRes, docsRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("chats").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(30),
    supabase.from("documents").select("id, name, created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  const { data: { user } } = userRes;
  if (!user) redirect("/");

  const chats = chatsRes.data ?? [];
  const documents = docsRes.data ?? [];

  return (
    <div className="h-[100dvh] w-screen bg-neo-black text-neo-white flex overflow-hidden" suppressHydrationWarning>
      <AppSidebar user={user} chats={chats} documents={documents} />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative">
        <AppHeader user={user} />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0">{children}</main>
      </div>
    </div>
  );
}
