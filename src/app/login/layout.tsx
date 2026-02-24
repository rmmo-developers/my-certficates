// layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://romportal.vercel.app/"), 
  title: "RMMO Application for Completion | ROM Portal by RMMO",
  description: "Application for Completion",
  openGraph: {
    title: "Login | ROM Portal by RMMO",
    description: "ROM Portal by RMMO: Register and Verify documents Easily",
    url: "https://romportal.vercel.app/",
    siteName: "Login | ROM Portal by RMMO",
    images: [
      {
        url: "/og-thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "Login | ROM Portal by RMMO",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | ROM Portal by RMMO",
    description: "ROM Portal by RMMO: Register and Verify documents Easily",
    images: ["/og-thumbnail.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}