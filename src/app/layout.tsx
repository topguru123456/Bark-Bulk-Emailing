import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bark Project Email Sender",
  description:
    "Send personalized Bark project outreach emails from multiple Gmail accounts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
