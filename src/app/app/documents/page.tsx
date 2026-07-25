import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentsClient } from "./documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-1 font-sans">
          Ingest
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Upload files or paste URLs. Documents are chunked for AI retrieval.
        </p>
      </div>
      <DocumentsClient />
    </div>
  );
}
