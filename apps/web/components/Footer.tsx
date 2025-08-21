export function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--naath-bronze)]/30">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-[color:var(--naath-blue)]/70">
        <div className="naath-underline w-24 mb-3" />
        <p>© {new Date().getFullYear()} Naath Archive. All rights reserved.</p>
      </div>
    </footer>
  );
}


