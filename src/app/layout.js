import { Manjari } from "next/font/google";
import "./globals.css";

const manjari = Manjari({
  variable: "--font-manjari",
  subsets: ["latin", "malayalam"],
  weight: ["100", "400", "700"],
});

export const metadata = {
  title: "Refard Card Generator",
  description: "Refard Card Generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manjari.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
