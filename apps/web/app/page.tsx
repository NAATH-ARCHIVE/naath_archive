import Link from "next/link";
import { Button } from "../components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-semibold text-[color:var(--naath-blue)] leading-tight">
            Preserving Naath heritage for generations to come
          </h2>
          <p className="mt-4 text-[color:var(--naath-blue)]/80">
            Explore articles, artifacts, and oral histories curated by the community and contributors.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/articles"><Button>Browse Articles</Button></Link>
            <Link href="/donate"><Button variant="secondary">Donate</Button></Link>
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--naath-bronze)]/40 p-6">
          <div className="naath-underline w-24 mb-4" />
          <p className="text-sm text-[color:var(--naath-blue)]/70">
            Our archive features research items, education resources, and community events.
          </p>
        </div>
      </section>
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg border-[color:var(--naath-blue)]/15">
          <h3 className="text-lg font-semibold text-[color:var(--naath-blue)]">Featured Articles</h3>
          <p className="text-sm text-[color:var(--naath-blue)]/70 mt-2">Coming soon…</p>
        </div>
        <div className="p-6 border rounded-lg border-[color:var(--naath-blue)]/15">
          <h3 className="text-lg font-semibold text-[color:var(--naath-blue)]">Artifacts</h3>
          <p className="text-sm text-[color:var(--naath-blue)]/70 mt-2">Coming soon…</p>
        </div>
        <div className="p-6 border rounded-lg border-[color:var(--naath-blue)]/15">
          <h3 className="text-lg font-semibold text-[color:var(--naath-blue)]">Events</h3>
          <p className="text-sm text-[color:var(--naath-blue)]/70 mt-2">Coming soon…</p>
        </div>
      </section>
    </main>
  );
}
