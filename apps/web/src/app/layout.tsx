import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Header from "@/components/header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "idna",
	description: "idna",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<NuqsAdapter>
					<Providers>
						<div className="grid grid-rows-[auto_1fr] h-svh">
							<Header />
							{children}
						</div>
					</Providers>
				</NuqsAdapter>
			</body>
		</html>
	);
}
