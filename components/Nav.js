"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/fotos", label: "Fotos" },
  { href: "/galeria", label: "Galería" },
  { href: "/cocteles", label: "Cócteles" }
];

export default function Nav({ transparent = false }) {
  const pathname = usePathname();

  return (
    <nav className={`nav ${transparent ? "navTransparent" : ""}`}>
      <div className="navLeft">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <Link href="/" className="navBrand">G & P</Link>

      <div className="navRight">
        <span>17.10.26</span>
      </div>
    </nav>
  );
}
