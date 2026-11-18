import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Suspense } from "react";
import BandeauBeta from "@/components/BandeauBeta";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/ui";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "EnsembleLink · Agir ensemble, près de chez soi", template: "%s · EnsembleLink" },
  description:
    "Version bêta. Trouvez une mission de bénévolat, participez à un évènement solidaire ou faites un don auprès d'associations vérifiées près de chez vous.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <ToastProvider>
            <BandeauBeta />
            <Suspense fallback={<div className="h-16 border-b border-ligne/70 bg-creme" />}>
              <Header />
            </Suspense>
            <main className="flex-1">
              <Suspense>{children}</Suspense>
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
