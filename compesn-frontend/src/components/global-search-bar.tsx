"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface GlobalSearchBarProps {
	className?: string;
	placeholder?: string;
	autoFocus?: boolean;
}

export function GlobalSearchBar({
	className,
	placeholder = "Search players, teams, scrims...",
	autoFocus = false,
}: GlobalSearchBarProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	// Debounce search term to avoid too many navigation calls
	const debouncedSearchTerm = useDebounce(searchTerm, 300);

	// Navigate to search page when debounced term changes
	useEffect(() => {
		if (debouncedSearchTerm.trim().length >= 3) {
			const searchParams = new URLSearchParams();
			searchParams.set("q", debouncedSearchTerm.trim());
			router.push(`/search?${searchParams.toString()}`);
		}
	}, [debouncedSearchTerm, router]);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Focus search bar on Ctrl+K or Cmd+K
			if ((event.ctrlKey || event.metaKey) && event.key === "k") {
				event.preventDefault();
				inputRef.current?.focus();
			}

			// Clear search on Escape
			if (event.key === "Escape" && isFocused) {
				setSearchTerm("");
				inputRef.current?.blur();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isFocused]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const term = searchTerm.trim();
		if (term.length >= 3) {
			// Check if it looks like a Riot ID (Name#Tag)
			if (term.includes("#")) {
				// We need to import this dynamically or ensure it's safe to use continuously
				// Since this is a client component, importing server action is fine
				const { searchSummoner } = await import("@/actions/summoner-search");
				const result = await searchSummoner(term);

				if (result.puuid) {
					router.push(`/profile/${result.puuid}/stats`);
					return;
				}
			}

			const searchParams = new URLSearchParams();
			searchParams.set("q", term);
			router.push(`/search?${searchParams.toString()}`);
		}
	};

	const handleClear = () => {
		setSearchTerm("");
		inputRef.current?.focus();
	};

	return (
		<form onSubmit={handleSubmit} className={cn("relative", className)}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					ref={inputRef}
					type="text"
					placeholder={placeholder}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					autoFocus={autoFocus}
					className={cn(
						"pl-10 pr-10 transition-all duration-200",
						isFocused && "ring-2 ring-primary/20",
						searchTerm && "pr-10",
					)}
					minLength={3}
				/>

				{searchTerm && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
					>
						<X className="h-3 w-3" />
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>

			{/* Keyboard shortcut hint */}
			{!isFocused && !searchTerm && (
				<div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
					<kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium text-foreground/60 opacity-100 bg-cyan-500/20">
						<span className="text-xs">⌘</span>K
					</kbd>
				</div>
			)}
		</form>
	);
}
