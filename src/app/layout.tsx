import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomly — Meeting room booking",
  description: "Find and book a room for your next great meeting.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
