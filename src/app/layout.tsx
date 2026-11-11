import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Cinzel } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
// next/font has no metrics for this family, so it can't build a size-matched fallback; skip that step.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Career House Quest", template: "%s · Career House Quest" },
  description: "Career discovery for Grades 9–12 in the Sairam Grand House Alliance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${cinzel.variable} ${atkinson.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
