import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Barbearia Premium",
  description: "Agende seu horário com os melhores profissionais.",
};

import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn(outfit.variable, "font-sans min-h-screen bg-background text-foreground antialiased")}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
