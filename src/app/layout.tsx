import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SolanaProvider } from "@/components/SolanaProvider";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { ClerkProvider } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sol Quest: Learn & Earn on the Solana Blockchain",
  description: "Embark on an exciting journey into the Solana ecosystem with Sol Quest! Our gamified learning platform makes mastering Solana fun and rewarding. Learn about blockchain technology, DeFi, NFTs, and more while earning rewards along the way.",
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
              <div className="flex justify-between items-center mb-4">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.svg"
                    alt="Crypto Word Puzzle"
                    width={300}
                    height={300}
                    className="dark:invert"
                  />
                </Link>
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
