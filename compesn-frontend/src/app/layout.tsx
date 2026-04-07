import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "../components/ui/sonner";
import { Providers } from "../components/providers";
import "./globals.css";

const geistSans = localFont({
	src: "./fonts/geist-latin.woff2",
	variable: "--font-geist-sans",
	display: "swap",
	weight: "100 900",
});

const geistMono = localFont({
	src: "./fonts/geist-mono-latin.woff2",
	variable: "--font-geist-mono",
	display: "swap",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Competitive E-Sports Network | The Ultimate Gaming Draft Tool",
	description:
		"Experience the most intuitive drafting tool with automatic saving and history features for gamers",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			{/* <head>
				<script
					crossOrigin="anonymous"
					src="//unpkg.com/react-scan/dist/auto.global.js"
				/>
			</head> */}
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers>{children}</Providers>
				<Toaster />
			</body>
		</html>
	);
}
