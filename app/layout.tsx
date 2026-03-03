import "./globals.css";
import AuthProvider from "./SessionProvider";
import StarsBackground from "./components/StarsBackground";
import Navbar from "./components/Navbar";
import ThemeRouteClass from "./components/ThemeRouteClass";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeRouteClass />
          <StarsBackground />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
