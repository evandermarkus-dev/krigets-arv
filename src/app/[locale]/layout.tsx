import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: "Krigets Arv | The Legacy of War",
  description: "Utforska sambanden mellan geopolitik, vapenprofiter och barns lidande. En investigativ rapport om 520 miljoner barn i aktiva konfliktzoner.",
  openGraph: {
    title: "Krigets Arv | The Legacy of War",
    description: "Utforska sambanden mellan geopolitik, vapenprofiter och barns lidande. En investigativ rapport om 520 miljoner barn i aktiva konfliktzoner.",
    type: "website",
    locale: "sv_SE",
    siteName: "Krigets Arv",
  },
  twitter: {
    card: "summary_large_image",
    title: "Krigets Arv | The Legacy of War",
    description: "Utforska sambanden mellan geopolitik, vapenprofiter och barns lidande.",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "sv" | "en")) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
