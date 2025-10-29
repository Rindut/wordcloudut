import type { Metadata } from "next";
import { Outfit, Inter, Raleway, Fredoka } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });

export const metadata: Metadata = {
  title: "DUKCATIL",
  description: "Create engaging live word clouds for presentations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${raleway.variable} ${fredoka.variable}`}>
      <body className="bg-neutral-50 text-gray-800" style={{ fontFamily: 'Raleway, sans-serif' }} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}










