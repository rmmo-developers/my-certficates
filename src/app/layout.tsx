import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Replace with your actual domain so the image path resolves correctly
  metadataBase: new URL("https://romportal.vercel.app"), 
  title: "ROM Portal by RMMO",
  description: "Verify Documents Easily",
  openGraph: {
    title: "ROM Portal by RMMO",
    description: "Registration and Verify Documents Easily",
    url: "https://romportal.vercel.app",
    siteName: "ROM Portal by RMMO",
    images: [
      {
        url: "/og-thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "ROM Portal by RMMO",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ROM Portal by RMMO",
    description: "Registration and Verify Documents Easily",
    images: ["/og-thumbnail.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}