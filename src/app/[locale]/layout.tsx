import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isSv = locale === "sv";

  const title = isSv ? "Krigets Arv | The Legacy of War" : "The Legacy of War | Krigets Arv";
  const description = isSv
    ? "Utforska sambanden mellan geopolitik, vapenprofiter och barns lidande. En investigativ rapport om 520 miljoner barn i aktiva konfliktzoner."
    : "Explore the connections between geopolitics, arms profits and children's suffering. An investigative report on 520 million children in active conflict zones.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: isSv ? "sv_SE" : "en_US",
      siteName: isSv ? "Krigets Arv" : "The Legacy of War",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
