"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useSession } from "@/lib/session";

type Section = "inicio" | "biblioteca" | "salon" | "acerca" | "auth";

function isActive(pathname: string | null, section: Section) {
  if (!pathname) return false;
  if (section === "inicio") return pathname === "/inicio";
  if (section === "biblioteca") return pathname === "/biblioteca" || pathname.startsWith("/juegos/");
  if (section === "salon") return pathname === "/salon";
  if (section === "acerca") return pathname === "/acerca";
  return pathname === "/login";
}

function NavView({ pathname }: { pathname: string | null }) {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const cls = (section: Section) => (isActive(pathname, section) ? "active" : "");

  return (
    <>
      <nav className="av-nav">
        <Link href="/inicio" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/inicio" className={cls("inicio")}>Inicio</Link>
          <Link href="/biblioteca" className={cls("biblioteca")}>Biblioteca</Link>
          <Link href="/salon" className={cls("salon")}>Salón de la Fama</Link>
          <Link href="/acerca" className={cls("acerca")}>Acerca de</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>{user.name} ▾</button>
        ) : (
          <Link href="/login" className="btn auth-btn">Iniciar Sesión</Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">≡</button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/inicio" className={cls("inicio")} onClick={close}>Inicio</Link>
        <Link href="/biblioteca" className={cls("biblioteca")} onClick={close}>Biblioteca</Link>
        <Link href="/salon" className={cls("salon")} onClick={close}>Salón de la Fama</Link>
        <Link href="/acerca" className={cls("acerca")} onClick={close}>Acerca de</Link>
        <Link href="/login" className={cls("auth")} onClick={close}>{user ? "Cuenta" : "Iniciar Sesión"}</Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CRÉDITOS · 03</div>
      </aside>
    </>
  );
}

function NavWithPathname() {
  return <NavView pathname={usePathname()} />;
}

// usePathname suspends on routes with unknown dynamic params under Cache Components,
// so the fallback renders the same nav without an active link.
export function Nav() {
  return (
    <Suspense fallback={<NavView pathname={null} />}>
      <NavWithPathname />
    </Suspense>
  );
}
