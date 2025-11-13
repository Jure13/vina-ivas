import { CheckoutProvider } from "./context/CheckoutContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <CartProvider>
            <CheckoutProvider>
              <Header />
              <CartSidebar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </CheckoutProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}