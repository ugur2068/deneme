"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, BarChart2, TrendingUp, TrendingDown, Activity, Zap, BookOpen } from "lucide-react";

const navItems = [
  { label: "Piyasa", href: "/", icon: BarChart2 },
  { label: "Fonlama Oranları", href: "/funding", icon: Activity },
  { label: "Açık Pozisyon", href: "/open-interest", icon: TrendingUp },
  { label: "Tasfiyeler", href: "/liquidations", icon: Zap },
  { label: "Long/Short Oranı", href: "/long-short", icon: TrendingDown },
  { label: "Korku & Açgözlülük", href: "/fear-greed", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: "#161b22", borderColor: "#30363d" }}
    >
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <span
              className="px-2 py-1 rounded text-sm font-bold"
              style={{ background: "#1e80ff", color: "#fff" }}
            >
              CG
            </span>
            <span style={{ color: "#e6edf3" }}>CryptoGlass</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{
                    color: active ? "#1e80ff" : "#8b949e",
                    background: active ? "rgba(30,128,255,0.12)" : "transparent",
                  }}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded"
            style={{ color: "#8b949e" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium"
                  style={{
                    color: active ? "#1e80ff" : "#8b949e",
                    background: active ? "rgba(30,128,255,0.12)" : "transparent",
                  }}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
