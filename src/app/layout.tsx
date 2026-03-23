import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";

export const metadata: Metadata = {
  title: "CryptoGlass - Kripto Para Analiz Platformu",
  description: "Binance verilerini kullanan ücretsiz kripto para analiz platformu. Funding rates, open interest, liquidations ve daha fazlası.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" style={{ background: "#0d1117" }}>
      <body className="min-h-screen flex flex-col" style={{ background: "#0d1117", color: "#e6edf3" }}>
        <TickerBar />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t py-4 text-center text-xs" style={{ borderColor: "#30363d", color: "#8b949e" }}>
          © 2024 CryptoGlass · Veriler Binance Public API üzerinden alınmaktadır
        </footer>
      </body>
    </html>
  );
}
