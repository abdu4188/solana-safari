import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SolanaProvider } from "@/components/SolanaProvider";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto Word Puzzle",
  description: "Solve crypto-related puzzles and earn rewards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased"
        )}
      >
        <ClerkProvider>
          <SolanaProvider>
            <div className="container mx-auto p-4">
              <div className="flex justify-end mb-4">
                <SolanaWalletButton />
              </div>
              <main>{children}</main>
            </div>
          </SolanaProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
