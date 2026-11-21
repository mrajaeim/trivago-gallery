import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Geist } from "next/font/google";
import { ThemeRegistry } from "@/components/theme-registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "trivago gallery",
  description: "Accommodation and photo gallery demo for trivago.",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript defaultMode="system" />
        <ThemeRegistry>
          {children}
          {modal}
        </ThemeRegistry>
      </body>
    </html>
  );
}
