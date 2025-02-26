import { Geist, Geist_Mono } from "next/font/google";
import { TrackProvider } from "./context/TrackContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Railway Capacity Management",
  description: "Railway Capacity Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TrackProvider>
          {children}
        </TrackProvider>
      </body>
    </html>
  );
}
