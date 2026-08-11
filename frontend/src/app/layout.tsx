import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "+EV Sports Betting Radar",
  description: "Advanced quantitative parley optimization and +EV finder.",
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
