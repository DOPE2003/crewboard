import "./globals.css";
import AuthProvider from "./SessionProvider";
import StarsBackground from "./components/StarsBackground";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StarsBackground />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}