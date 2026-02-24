// layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://romportal.vercel.app/grad-applicants"), 
  title: "RMMO Application for Completion | ROM Portal by RMMO",
  description: "Application for Completion",
  openGraph: {
    title: "RMMO Application for Completion | ROM Portal by RMMO",
    description: "Application for Completion",
    url: "https://romportal.vercel.app/grad-applicants",
    siteName: "RMMO Application for Completion | ROM Portal by RMMO",
    images: [
      {
        url: "/og-thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "RMMO Application for Completion | ROM Portal by RMMO",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RMMO Application for Completion | ROM Portal by RMMO",
    description: "Registration and Verify Documents Easily",
    images: ["/og-thumbnail.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}