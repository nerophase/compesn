"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserNav from "./user-nav";
import { usePathname } from "next/navigation";
import { GlobalSearchBar } from "@/components/global-search-bar";

// Custom NavLink component with advanced hover effects
const NavLink = ({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => {
	return (
		<Link
			href={href}
			className="group relative flex items-center justify-center px-2 py-1 text-nowrap"
		>
			<div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-md backdrop-blur-sm transition-all duration-300 z-0"></div>

			{/* Animated corner brackets */}
			<div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/0 group-hover:border-cyan-500/80 transition-all duration-300 z-10"></div>
			<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/0 group-hover:border-cyan-500/80 transition-all duration-300 z-10"></div>
			<div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/0 group-hover:border-cyan-500/80 transition-all duration-300 z-10"></div>
			<div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/0 group-hover:border-cyan-500/80 transition-all duration-300 z-10"></div>

			{/* Active state dot indicator */}
			{isActive && (
				<motion.div
					layoutId="activeNavDot"
					className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(96,204,247,0.8)]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				/>
			)}

			{/* Text with glow effect */}
			<span
				className={`relative font-medium text-sm z-20 tracking-wide ${
					isActive ? "text-cyan-400" : "text-gray-300"
				} group-hover:text-cyan-300 transition-colors duration-300`}
			>
				{label}
			</span>
		</Link>
	);
};

export default function Navbar() {
	const [activeLink, setActiveLink] = useState("");
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [liveDraftId, setLiveDraftId] = useState("");
	const pathname = usePathname();

	useEffect(() => {
		const liveDraftId = localStorage.getItem("live-draft") ?? "";
		setLiveDraftId(liveDraftId);
	}, [pathname]);

	// Update active link based on current path
	useEffect(() => {
		switch (pathname) {
			case "/":
				setActiveLink("Home");
				break;
			case "/scrims":
				setActiveLink("Scrims");
				break;
			case "/teams":
				setActiveLink("Teams");
				break;
			case "/history":
				setActiveLink("History");
				break;
			case "/profile":
				setActiveLink("Profile");
				break;
			default:
				setActiveLink("");
				break;
		}

		if (pathname.slice(0, 6) === "/draft") {
			if (pathname === "/draft" || pathname === "/draft/") setActiveLink("Draft");
			else setActiveLink("Live Draft"); // The current path is something like /draft/...
		}

		// Handle scrims sub-routes
		if (pathname.startsWith("/scrims")) {
			setActiveLink("Scrims");
		}

		// Handle teams sub-routes
		if (pathname.startsWith("/teams")) {
			setActiveLink("Teams");
		}
	}, [pathname]);

	// Handle scroll effect for navbar
	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [scrolled]);

	// Nav items with icons (represented as JSX for now)
	const navItems = [
		{
			label: "Home",
			href: "/",
			icon: <span className="text-cyan-500/80">🏠</span>,
		},
		{
			label: "Scrims",
			href: "/scrims",
			icon: <span className="text-cyan-500/80">⚔️</span>,
		},
		{
			label: "Teams",
			href: "/teams",
			icon: <span className="text-cyan-500/80">👥</span>,
		},
		{
			label: "Draft",
			href: "/draft",
			icon: <span className="text-cyan-500/80">⚙</span>,
		},
		{
			label: "Messages",
			href: "/messages",
			icon: <span className="text-cyan-500/80">💬</span>,
		},
		{
			label: "History",
			href: "/history",
			icon: <span className="text-cyan-500/80">⌚</span>,
		},
	];

	return (
		<motion.nav
			initial={false}
			animate={{
				backgroundColor: scrolled ? "rgba(9, 11, 16, 0.85)" : "rgba(9, 11, 16, 0.4)",
				backdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
				borderBottom: scrolled
					? "1px solid rgba(96, 204, 247, 0.2)"
					: "1px solid rgba(96, 204, 247, 0.1)",
			}}
			transition={{ duration: 0.4 }}
			//  bg-gradient-to-b from-[#0A0E17] via-[#111827] to-[#1A222E] text-white
			className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 h-16"
		>
			<div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-transparent to-transparent pointer-events-none -z-50" />
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none -z-50" />
			{/* Animation Background Elements */}
			{/* <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] opacity-10 bg-cover bg-center pointer-events-none" /> */}
			{/* Top accent line with animated gradient */}
			<div className="h-0.5 w-full bg-gradient-to-r from-cyan-300/0 via-cyan-500/80 to-cyan-300/0 relative overflow-hidden">
				<motion.div
					animate={{
						x: ["0%", "100%"],
						opacity: [0, 1, 0],
					}}
					transition={{
						repeat: Infinity,
						duration: 3,
						ease: "easeInOut",
					}}
					className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
				/>
			</div>

			<div className="mx-auto">
				{/* flex items-center justify-between  */}
				<div className="grid grid-cols-3 h-16 px-6 lg:px-16 justify-items-center">
					{/* Logo Section - Left */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
						className="flex items-center gap-3 w-full"
					>
						{/* Split text logo with glitch effect */}
						<div className="flex flex-col leading-tight">
							<span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
								Competitive E-Sports Network
							</span>
							<span className="text-[10px] tracking-[0.2em] text-cyan-500/70 uppercase">
								Gaming Suite v2.5
							</span>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="hidden md:flex items-center"
					>
						<div className="h-8 w-6 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-md mr-2"></div>

						<div className="flex space-x-1 bg-cyan-900/10 px-2 py-1 rounded-md backdrop-blur-sm border border-cyan-500/10">
							{navItems.map((item) => (
								<NavLink
									key={item.label}
									href={item.href}
									label={item.label}
									isActive={activeLink === item.label}
								/>
							))}
						</div>

						<div className="h-8 w-6 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-md ml-2"></div>

						{/* <div className="hidden lg:flex items-center ml-6 bg-black/20 px-3 py-1 rounded-sm border ">
								<div className="text-xs text-cyan-400/90 font-mono">
									<span className="mr-2">SYS:</span>
									<span className="text-green-400">
										ONLINE
									</span>
									<span className="mx-2">|</span>
									<span className="text-cyan-300">
										{timeString}
									</span>
								</div>
							</div> */}
					</motion.div>

					{/* Right Section - Search & User Controls */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="flex items-center gap-3 justify-self-end"
					>
						{/* Global Search Bar */}
						<div className="hidden lg:block w-64">
							<GlobalSearchBar className="w-full" placeholder="Search..." />
						</div>

						{/* User Authentication Buttons */}
						<UserNav />

						{/* Mobile menu button */}
						<div className="md:hidden">
							<button
								onClick={() => setMenuOpen(!menuOpen)}
								className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-md border border-cyan-500/30"
							>
								<motion.span
									animate={{
										rotate: menuOpen ? 45 : 0,
										y: menuOpen ? 3 : 0,
									}}
									className="w-4 h-0.5 bg-cyan-400"
								/>
								<motion.span
									animate={{ opacity: menuOpen ? 0 : 1 }}
									className="w-4 h-0.5 bg-cyan-400"
								/>
								<motion.span
									animate={{
										rotate: menuOpen ? -45 : 0,
										y: menuOpen ? -3 : 0,
									}}
									className="w-4 h-0.5 bg-cyan-400"
								/>
							</button>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			<AnimatePresence mode="sync">
				{menuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="md:hidden bg-background backdrop-blur-lg border rounded-2xl relative"
					>
						<div className="flex flex-col px-6 py-4 space-y-4">
							{/* Mobile Search Bar */}
							<div className="lg:hidden">
								<GlobalSearchBar
									className="w-full"
									placeholder="Search players, teams, scrims..."
								/>
							</div>

							{/* Navigation Links */}
							<div className="space-y-2">
								{navItems.map((item) => (
									<Link
										key={item.label}
										href={item.href}
										className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-md transition-colors"
									>
										{item.icon}
										<span>{item.label}</span>
									</Link>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
}
