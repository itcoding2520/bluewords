import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VocabularyProvider } from "@/contexts/VocabularyContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BlueWords",
    template: "%s | BlueWords",
  },
  description:
    "BlueWords helps you track, organize, and master your English vocabulary.",
  applicationName: "BlueWords",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <VocabularyProvider>
          {children}
        </VocabularyProvider>

        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}
