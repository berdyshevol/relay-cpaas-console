import { Console } from "@/components/Console";
import { listConversations } from "@/lib/store";
import { readSettings, toPublic } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const conversations = listConversations();
  const settings = toPublic(await readSettings());
  return (
    <Console initialConversations={conversations} initialSettings={settings} />
  );
}
