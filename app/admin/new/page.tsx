import { NewWorkForm } from "./NewWorkForm";

export default function NewWorkPage() {
  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">新增作品</h1>
      <NewWorkForm />
    </main>
  );
}
