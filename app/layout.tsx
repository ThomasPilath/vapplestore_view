import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Sidemenu from "@/components/side-menu";

export const metadata: Metadata = {
  title: "Vapplestore View",
  description: "Create by Pilath",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning={true}>
      <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen">
              <Sidemenu />
              <main className="flex-1 md:ml-64 overflow-auto bg-background">
                {children}
              </main>
            </div>
          </ThemeProvider>
      </body>
    </html>
  );
}
