import type { Metadata } from "next";
import { Rubik, Inter } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "kartis.info - ניהול כרטיסים",
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
      <body className={`${rubik.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
