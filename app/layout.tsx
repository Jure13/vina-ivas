import { CheckoutProvider } from "./context/CheckoutContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import CookieNotice from "./components/CookieNotice";
import ToastProvider from "./components/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="min-h-screen flex flex-col">
        <ErrorBoundary>
        <LanguageProvider>
          <CartProvider>
            <CheckoutProvider>
              <Header />
              <CartSidebar />
              <main className="flex-grow">{children}</main>
              <CookieNotice/>
              <Footer />
              <ToastProvider />
            </CheckoutProvider>
          </CartProvider>
        </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}