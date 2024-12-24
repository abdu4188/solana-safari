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
  title: "Solana Safari: Learn & Earn on the Solana Blockchain",
  description: "Embark on an exciting journey into the Solana ecosystem with Solana Safari! Our gamified learning platform makes mastering Solana fun and rewarding. Learn about blockchain technology, DeFi, NFTs, and more while earning rewards along the way.",
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
            <div className="relative z-10">
              <div className="fixed inset-0 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-3xl -z-10" />
              {/* Blob 1 - Top Left */}
              <div className="fixed top-0 left-0 -z-10 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px]">
                <Image
                  src="/blob-1.webp"
                  alt="Background blob 1"
                  fill
                  className="object-contain opacity-60 scale-[2] rotate-[-45deg]"
                />
              </div>
              {/* Blob 2 - Top Right */}
              <div className="fixed -top-20 right-0 -z-10 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px]">
                <Image
                  src="/blob-2.webp"
                  alt="Background blob 2"
                  fill
                  className="object-contain opacity-60 scale-[2] rotate-[45deg]"
                />
              </div>
              <header className="fixed top-0 left-0 right-0 z-50 bg-black-300/40 backdrop-blur-md border-b border-white/10">
                <nav className="container mx-auto px-4 py-4">
                  <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-4">
                      <Image
                        src="/logo.svg"
                        alt="Crypto Word Puzzle"
                        width={250}
                        height={250}
                        className="dark:invert"
                      />
                    </Link>
                    <div className="flex items-center space-x-4">
                      <SolanaWalletButton />
                    </div>
                  </div>
                </nav>
              </header>
              <main className="pt-20 mt-32">
                {children}
              </main>
              <footer className="fixed bottom-0 left-0 right-0 z-50 mt-auto py-8 text-center text-white/60 text-sm">
                <p>Built with ❤️ on Solana</p>
              </footer>
            </div>
          </SolanaProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
