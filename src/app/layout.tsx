import "@/styles/globals.css";
import AuthProvider from "./SessionProvider";
import StarsBackground from "@/components/ui/StarsBackground";
import Navbar from "@/components/layout/Navbar";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";
import { Web3Provider } from "@/components/ui/Web3Provider";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Web3Provider>
            <ThemeRouteClass />
            <StarsBackground />
            <Navbar />
            {children}
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
