import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalActionOverlay } from "@/components/ui/GlobalActionOverlay";
import { RouteVocabularyProvider } from "@/components/layout/RouteVocabularyProvider";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BlueWords",
  },
  icons: {
    icon: [
      { url: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};



export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConfirmDialogProvider>
          <AppLayout>
            <RouteVocabularyProvider>{children}</RouteVocabularyProvider>
          </AppLayout>

          <GlobalActionOverlay />

          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration={3000}
          />
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
