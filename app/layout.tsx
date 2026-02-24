import "./globals.css";
import Navbar from "./components/Navbar";
import StarsBackground from "./components/StarsBackground";

export const metadata = {
  title: "Crewboard",
  description: "Connecting talents. Building crews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap"
        />
      </head>
      <body>
        {/* ✅ ONE global canvas for all routes */}
        <StarsBackground />

        <Navbar />
        {children}
      </body>
    </html>
  );
}