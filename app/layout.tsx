export const metadata = {
  title: "ACT Protocols Search",
  description: "Search medical protocols (ACT Guidelines) — deployed on Vercel",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
