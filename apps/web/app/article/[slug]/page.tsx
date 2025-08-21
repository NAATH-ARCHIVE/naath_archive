type Props = { params: { slug: string } };
export async function generateMetadata({ params }: Props) {
  return { title: `Article: ${params.slug}` };
}
export default function Page({ params }: Props) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-[color:var(--naath-blue)]">{params.slug}</h2>
      <p className="mt-2 text-[color:var(--naath-blue)]/70">Article content coming soon…</p>
      <section className="mt-10">
        <h3 className="text-lg font-semibold text-[color:var(--naath-blue)]">Comments</h3>
        <p className="text-sm text-[color:var(--naath-blue)]/70 mt-2">Threaded comments will appear here.</p>
      </section>
    </main>
  );
}


