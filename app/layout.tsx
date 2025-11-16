import type { Metadata } from "next";
import { Rubik, Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
  openGraph: {
    title: "kartis.info - ניהול כרטיסים",
    description: "מערכת ניהול כרטיסים לאירועים ומשחקים",
    url: "https://kartis.info",
    siteName: "kartis.info",
    images: [
      {
        url: "/images/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "kartis.info - ניהול כרטיסים לאירועים ומשחקים",
      },
    ],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "kartis.info - ניהול כרטיסים",
    description: "מערכת ניהול כרטיסים לאירועים ומשחקים",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} ${inter.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
