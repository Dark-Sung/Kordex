import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kordex",
  description: "Control de inventario para tiendas y organizaciones",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { if (localStorage.getItem('kordex-theme') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch {}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
