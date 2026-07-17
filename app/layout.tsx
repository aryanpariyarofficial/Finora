import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LocaleProvider } from "@/components/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getCalendar, getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "700"],
  // Fallback font in --font-sans; only fetched when Devanagari glyphs render,
  // so English users never download it up front.
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#14162e" },
  ],
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://finoraypf.vercel.app";
const TITLE = "Finora — Your Personal Financial Command Center";
const DESCRIPTION =
  "Track income, expenses, budgets, loans and investments in one place. Built for Nepal with NPR, eSewa, Khalti, Bikram Sambat and English + नेपाली.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Finora",
  },
  description: DESCRIPTION,
  applicationName: "Finora",
  keywords: [
    "personal finance app",
    "expense tracker Nepal",
    "budget app Nepal",
    "money manager",
    "loan EMI tracker",
    "investment tracker",
    "NPR expense tracker",
    "eSewa Khalti finance",
    "Bikram Sambat calendar app",
    "Finora",
  ],
  authors: [{ name: "UDAN Technology" }],
  creator: "UDAN Technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Finora",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    alternateLocale: ["ne_NP"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finora — Your Personal Financial Command Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, calendar] = await Promise.all([getLocale(), getCalendar()]);
  const dict = dictionaries[locale];

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider dict={dict} locale={locale} calendar={calendar}>
            {children}
          </LocaleProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
