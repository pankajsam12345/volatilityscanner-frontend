import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import { SymbolProvider } from "@/components/SymbolContext";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Volatility Opportunity Scanner",
  description: "Relative-value volatility opportunity engine — model-based estimates on demo data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-full min-h-screen flex-col bg-bg text-text antialiased">
        <AuthProvider>
          <SymbolProvider>
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </div>
          </SymbolProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
