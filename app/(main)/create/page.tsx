import Link from "next/link";
import { CreateTopicForm } from "@/components/CreateTopicForm";

export const dynamic = "force-dynamic";

export default function CreateTopicPage() {
  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-600">Create a topic</h1>
        <p className="text-sm text-neutral-500">
          Make your own quiz topic, then add questions to it.
        </p>
      </header>
      <CreateTopicForm />
      <Link href="/topics" className="text-sm text-neutral-500 hover:underline">
        ← Back to topics
      </Link>
    </main>
  );
}
