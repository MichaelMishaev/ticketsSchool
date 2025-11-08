import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "באריֿ - ניהול כרטיסים",
  description: "מערכת ניהול כרטיסים לאירועים ומשחקים - kartis.info",
  metadataBase: new URL("https://kartis.info"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
