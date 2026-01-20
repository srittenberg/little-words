import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Little Words",
  description: "A soundboard of first spoken words",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
