// app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "Crewboard",
  description: "Web3 talent marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <div className="bg">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
