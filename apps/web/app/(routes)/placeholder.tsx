export default function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-[color:var(--naath-blue)]">{title}</h2>
      <p className="mt-2 text-[color:var(--naath-blue)]/70">Content coming soon…</p>
    </main>
  );
}


