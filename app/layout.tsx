import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadyRecipe - Turn Your Ingredients into Meal Ideas",
  description: "Recipe recommendation app that helps you turn ingredients you have into delicious meals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
