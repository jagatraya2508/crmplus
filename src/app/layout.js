import "./globals.css";

export const metadata = {
  title: "CRM Plus - Sales & Marketing",
  description: "Aplikasi CRM lengkap untuk Sales & Marketing dengan fitur GPS Tracking, Check-in/Check-out, Order Management, dan Pipeline",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0e1a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
