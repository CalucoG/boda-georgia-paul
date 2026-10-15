import "./globals.css";

export const metadata = {
  title: "Georgia & Paul | Nuestra Boda",
  description: "Georgia & Paul · 17 de octubre de 2026 · 6:00 PM",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport = {
  themeColor: "#7d654d"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
