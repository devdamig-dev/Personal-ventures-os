import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Personal Ventures OS",
    template: "%s · Personal Ventures OS",
  },
  description:
    "Founder operating system and multi-agent command center for GastroPilot, Sin Equipaje, Nexodg and future owned ventures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
