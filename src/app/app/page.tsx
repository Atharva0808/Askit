import { Chat } from "@/components/chat";

type Props = { searchParams: Promise<{ chatId?: string }> };

export default async function AppPage({ searchParams }: Props) {
  const { chatId } = await searchParams;
  return (
    <div className="h-full flex flex-col w-full">
      <Chat initialChatId={chatId ?? null} />
    </div>
  );
}
