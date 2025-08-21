import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Articles" },
  { href: "/archive", label: "Archive" },
  { href: "/oral-histories", label: "Oral Histories" },
  { href: "/research", label: "Research" },
  { href: "/education", label: "Education" },
  { href: "/events", label: "Events" },
  { href: "/contribute", label: "Contribute" },
  { href: "/donate", label: "Donate" },
  { href: "/shop", label: "Shop" },
  { href: "/account", label: "Account" },
  { href: "/admin", label: "Admin" },
];

export function NavBar() {
  return (
    <nav className="mt-6">
      <ul className="flex flex-wrap gap-4 text-sm text-[color:var(--naath-blue)]/80">
        {nav.map((item) => (
          <li key={item.href}>
            <Link className="hover:text-[color:var(--naath-blue)]" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}


