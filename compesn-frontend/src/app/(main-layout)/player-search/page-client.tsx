"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
	Activity,
	BadgeCheck,
	BarChart3,
	CalendarClock,
	CheckCircle2,
	Copy,
	Crown,
	Flame,
	Gamepad2,
	Hash,
	Loader2,
	MapPin,
	Medal,
	RefreshCw,
	Search,
	Shield,
	Sparkles,
	Star,
	Swords,
	Target,
	Trophy,
	UserRound,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { REGIONS } from "@/constants/regions";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { skipToken, useQuery } from "@tanstack/react-query";
import type {
	ChampionMasterySummary,
	PlayerLookupResponse,
	PlayerMatchSummary,
	RankedQueue,
} from "@/trpc/routers/players/players.schema";
import type { TRegion } from "@/trpc/routers/teams/teams.schema";

const MATCH_PAGE_SIZE = 10;

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const formatDate = (date: Date | string | null) => {
	if (!date) return "Unavailable";

	return new Date(date).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatShortDate = (date: Date | string | null) => {
	if (!date) return "No date";

	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
};

const formatDuration = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getRoleLabel = (role: string) => {
	const normalized = role.toUpperCase();

	if (normalized === "BOTTOM") return "BOT";
	if (normalized === "UTILITY") return "SUPPORT";
	if (normalized === "NONE" || normalized === "UNKNOWN") return "FILL";

	return normalized;
};

function MetricTile({
	icon,
	label,
	value,
	subtitle,
}: {
	icon: ReactNode;
	label: string;
	value: string | number;
	subtitle?: string;
}) {
	return (
		<div className="rounded-md border border-cyan-300/15 bg-slate-950/55 p-4">
			<div className="flex items-center gap-2 text-xs uppercase text-slate-500">
				{icon}
				<span>{label}</span>
			</div>
			<div className="mt-2 text-2xl font-black text-white">{value}</div>
			{subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
		</div>
	);
}

function StatusBadge({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
			{children}
		</span>
	);
}

function RankedCard({ queue }: { queue: RankedQueue }) {
	const totalGames = queue.wins + queue.losses;

	return (
		<div className="rounded-lg border border-yellow-300/20 bg-gradient-to-br from-yellow-500/10 via-slate-950/75 to-slate-900/80 p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="flex items-center gap-2 text-sm font-semibold text-yellow-200">
						<Trophy size={16} />
						{queue.queueLabel}
					</div>
					<div className="mt-3 text-2xl font-black text-white">
						{queue.tier} {queue.rank}
					</div>
					<div className="text-sm text-slate-400">{queue.leaguePoints} LP</div>
				</div>
				<div className="rounded-md border border-white/10 bg-black/25 px-3 py-2 text-right">
					<div className="text-xl font-bold text-white">{queue.winRate}%</div>
					<div className="text-xs text-slate-500">Win rate</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-3 gap-2 text-center">
				<div className="rounded-md bg-black/20 px-2 py-2">
					<div className="font-bold text-emerald-300">{queue.wins}</div>
					<div className="text-xs text-slate-500">Wins</div>
				</div>
				<div className="rounded-md bg-black/20 px-2 py-2">
					<div className="font-bold text-rose-300">{queue.losses}</div>
					<div className="text-xs text-slate-500">Losses</div>
				</div>
				<div className="rounded-md bg-black/20 px-2 py-2">
					<div className="font-bold text-white">{totalGames}</div>
					<div className="text-xs text-slate-500">Games</div>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{queue.hotStreak && <StatusBadge><Flame size={13} />Hot</StatusBadge>}
				{queue.freshBlood && <StatusBadge><Sparkles size={13} />Fresh</StatusBadge>}
				{queue.veteran && <StatusBadge><Shield size={13} />Veteran</StatusBadge>}
				{queue.inactive && <StatusBadge><Activity size={13} />Inactive</StatusBadge>}
			</div>
		</div>
	);
}

function MasteryCard({ mastery }: { mastery: ChampionMasterySummary }) {
	return (
		<div className="rounded-lg border border-cyan-300/15 bg-slate-950/55 p-4">
			<div className="flex items-center gap-3">
				<div className="relative size-14 overflow-hidden rounded-md border border-white/15 bg-slate-900">
					<Image
						src={mastery.championImageUrl}
						alt={mastery.championName}
						width={56}
						height={56}
						className="size-full object-cover"
					/>
				</div>
				<div className="min-w-0 flex-1">
					<div className="truncate font-bold text-white">{mastery.championName}</div>
					<div className="text-sm text-cyan-300">Mastery {mastery.championLevel}</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<div className="rounded-md bg-black/20 px-2 py-2">
					<div className="text-sm font-bold text-white">
						{formatNumber(mastery.championPoints)}
					</div>
					<div className="text-xs text-slate-500">Points</div>
				</div>
				<div className="rounded-md bg-black/20 px-2 py-2">
					<div className="text-sm font-bold text-white">{mastery.tokensEarned}</div>
					<div className="text-xs text-slate-500">Tokens</div>
				</div>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
				{mastery.chestGranted ? (
					<span className="text-emerald-300">Chest earned</span>
				) : (
					<span>Chest available</span>
				)}
				<span className="text-slate-600">/</span>
				<span>Last played {formatShortDate(mastery.lastPlayTime)}</span>
			</div>
		</div>
	);
}

function MatchCard({ match }: { match: PlayerMatchSummary }) {
	return (
		<div
			className={`rounded-lg border bg-slate-950/55 p-4 ${
				match.win ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-rose-400"
			}`}
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto_auto] lg:items-center">
				<div className="flex min-w-0 items-center gap-3">
					<div className="relative size-14 overflow-hidden rounded-md border border-white/15 bg-slate-900">
						<Image
							src={match.championImageUrl}
							alt={match.championName}
							width={56}
							height={56}
							className="size-full object-cover"
						/>
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={`font-black ${match.win ? "text-emerald-300" : "text-rose-300"}`}
							>
								{match.win ? "Victory" : "Defeat"}
							</span>
							<span className="text-xs text-slate-500">{match.queueLabel}</span>
						</div>
						<div className="mt-1 truncate text-sm text-white">
							{match.championName} / {getRoleLabel(match.role)}
						</div>
						<div className="mt-1 break-all text-xs text-slate-500">{match.matchId}</div>
					</div>
				</div>

				<div className="text-left lg:text-right">
					<div className="text-lg font-black text-white">
						{match.kills}/{match.deaths}/{match.assists}
					</div>
					<div className="text-xs text-cyan-300">{match.kda} KDA</div>
				</div>
				<div className="grid grid-cols-3 gap-2 lg:flex lg:gap-4">
					<div>
						<div className="text-sm font-bold text-white">{formatNumber(match.creepScore)}</div>
						<div className="text-xs text-slate-500">CS</div>
					</div>
					<div>
						<div className="text-sm font-bold text-white">{formatNumber(match.goldEarned)}</div>
						<div className="text-xs text-slate-500">Gold</div>
					</div>
					<div>
						<div className="text-sm font-bold text-white">{match.visionScore}</div>
						<div className="text-xs text-slate-500">Vision</div>
					</div>
				</div>
				<div className="text-sm text-slate-400">
					<div>{formatDuration(match.gameDuration)}</div>
					<div className="text-xs text-slate-500">{formatDate(match.gameCreation)}</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						void navigator.clipboard.writeText(match.matchId);
						toast.success("Match ID copied.");
					}}
					className="w-fit rounded-md border-cyan-300/25 bg-slate-950/60 text-cyan-100 hover:bg-cyan-300/10"
				>
					<Copy />
					Copy
				</Button>
			</div>
		</div>
	);
}

function ProfileResult({
	profile,
	matches,
	hasMore,
	isLoadingMore,
	onLoadMore,
}: {
	profile: PlayerLookupResponse;
	matches: PlayerMatchSummary[];
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
}) {
	const displayName = `${profile.account.gameName}#${profile.account.tagLine}`;

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-lg border border-cyan-300/25 bg-slate-950/70 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
				<div className="border-b border-cyan-300/15 bg-gradient-to-r from-cyan-500/15 via-slate-900/20 to-yellow-500/10 p-5">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex min-w-0 items-center gap-4">
							<div className="relative size-20 overflow-hidden rounded-lg border border-cyan-300/30 bg-slate-900">
								<Image
									src={profile.summoner.profileIconUrl}
									alt={displayName}
									width={80}
									height={80}
									className="size-full object-cover"
								/>
								<div className="absolute bottom-0 right-0 rounded-tl-md bg-slate-950/90 px-2 py-0.5 text-xs font-bold text-cyan-200">
									{profile.summoner.summonerLevel}
								</div>
							</div>
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2 text-xs uppercase text-cyan-300">
									<BadgeCheck size={15} />
									<span>Riot profile</span>
								</div>
								<h2 className="mt-2 break-all text-3xl font-black text-white">{displayName}</h2>
								<div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
									<span className="inline-flex items-center gap-1">
										<MapPin size={14} />
										{profile.account.region.toUpperCase()}
									</span>
									<span className="inline-flex items-center gap-1">
										<CalendarClock size={14} />
										Updated {formatDate(profile.summoner.revisionDate)}
									</span>
								</div>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								void navigator.clipboard.writeText(profile.account.puuid);
								toast.success("PUUID copied.");
							}}
							className="rounded-md border-cyan-300/25 bg-slate-950/60 text-cyan-100 hover:bg-cyan-300/10"
						>
							<Copy />
							Copy PUUID
						</Button>
					</div>
				</div>

				<div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
					<MetricTile
						icon={<Gamepad2 size={14} />}
						label="Recent games"
						value={profile.aggregate.totalRecentGames}
						subtitle="Current loaded sample"
					/>
					<MetricTile
						icon={<Trophy size={14} />}
						label="Win rate"
						value={`${profile.aggregate.winRate}%`}
						subtitle={`${profile.aggregate.wins} wins loaded`}
					/>
					<MetricTile
						icon={<Swords size={14} />}
						label="Average KDA"
						value={profile.aggregate.averageKda}
						subtitle="Across loaded games"
					/>
					<MetricTile
						icon={<Hash size={14} />}
						label="DDragon"
						value={profile.ddragonVersion}
						subtitle="Asset version"
					/>
				</div>
			</section>

			<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
				<div className="space-y-5">
					<div className="rounded-lg border border-yellow-300/20 bg-slate-950/45 p-5">
						<div className="mb-4 flex items-center gap-2">
							<Crown className="text-yellow-300" size={20} />
							<h3 className="text-xl font-black text-white">Ranked Queues</h3>
						</div>
						{profile.rankedQueues.length > 0 ? (
							<div className="grid gap-4 md:grid-cols-2">
								{profile.rankedQueues.map((queue) => (
									<RankedCard key={queue.queueType} queue={queue} />
								))}
							</div>
						) : (
							<div className="rounded-md border border-white/10 bg-black/20 p-5 text-slate-400">
								No ranked queues returned for this region.
							</div>
						)}
					</div>

					<div className="rounded-lg border border-cyan-300/20 bg-slate-950/45 p-5">
						<div className="mb-4 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<BarChart3 className="text-cyan-300" size={20} />
								<h3 className="text-xl font-black text-white">Recent Matches</h3>
							</div>
							<span className="text-xs text-slate-500">{matches.length} loaded</span>
						</div>
						{matches.length > 0 ? (
							<div className="space-y-3">
								{matches.map((match) => (
									<MatchCard key={match.matchId} match={match} />
								))}
							</div>
						) : (
							<div className="rounded-md border border-white/10 bg-black/20 p-5 text-slate-400">
								No recent matches found.
							</div>
						)}
						<div className="mt-5 flex justify-center">
							<Button
								type="button"
								onClick={onLoadMore}
								disabled={!hasMore || isLoadingMore}
								className="rounded-md border border-cyan-300/35 bg-cyan-500/90 px-5 font-bold text-slate-950 hover:bg-cyan-300"
							>
								{isLoadingMore ? <Loader2 className="animate-spin" /> : <RefreshCw />}
								{hasMore ? "Load more" : "No more matches"}
							</Button>
						</div>
					</div>
				</div>

				<aside className="rounded-lg border border-cyan-300/20 bg-slate-950/45 p-5">
					<div className="mb-4 flex items-center gap-2">
						<Medal className="text-cyan-300" size={20} />
						<h3 className="text-xl font-black text-white">Top Mastery</h3>
					</div>
					{profile.topChampionMasteries.length > 0 ? (
						<div className="space-y-3">
							{profile.topChampionMasteries.map((mastery) => (
								<MasteryCard key={mastery.championId} mastery={mastery} />
							))}
						</div>
					) : (
						<div className="rounded-md border border-white/10 bg-black/20 p-5 text-slate-400">
							No champion mastery data returned.
						</div>
					)}
				</aside>
			</section>
		</div>
	);
}

export default function PlayerSearchPageClient() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const [region, setRegion] = useState<TRegion>("na");
	const [gameName, setGameName] = useState("");
	const [tagLine, setTagLine] = useState("");
	const [lookupInput, setLookupInput] = useState<{
		region: TRegion;
		gameName: string;
		tagLine: string;
	} | null>(null);
	const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
	const [nextStart, setNextStart] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasHydrated, setHasHydrated] = useState(false);

	const canSearch = useMemo(
		() => gameName.trim().length >= 3 && /^[a-zA-Z0-9]{3,5}$/.test(tagLine.trim()),
		[gameName, tagLine],
	);

	const profileQuery = useQuery(
		trpc.players.lookupByRiotId.queryOptions(
			lookupInput ?? skipToken,
			{
				retry: false,
			},
		),
	);

	useEffect(() => {
		setHasHydrated(true);
	}, []);

	useEffect(() => {
		if (!profileQuery.data) return;

		setMatches(profileQuery.data.recentMatches.matches);
		setNextStart(profileQuery.data.recentMatches.nextStart);
		setHasMore(profileQuery.data.recentMatches.hasMore);
	}, [profileQuery.data]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canSearch) return;

		setLookupInput({
			region,
			gameName: gameName.trim(),
			tagLine: tagLine.trim(),
		});
		setMatches([]);
		setNextStart(0);
		setHasMore(false);
	};

	const handleLoadMore = async () => {
		if (!profileQuery.data || isLoadingMore || !hasMore) return;

		setIsLoadingMore(true);
		try {
			const response = await trpcClient.players.getRecentMatches.query({
				region: profileQuery.data.account.region,
				puuid: profileQuery.data.account.puuid,
				start: nextStart,
				count: MATCH_PAGE_SIZE,
			});

			setMatches((currentMatches) => [...currentMatches, ...response.matches]);
			setNextStart(response.nextStart);
			setHasMore(response.hasMore);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Unable to load more matches.");
		} finally {
			setIsLoadingMore(false);
		}
	};

	const isSearching = profileQuery.isFetching;
	const isSearchUnavailable = !canSearch || isSearching;
	const shouldDisableSearch = hasHydrated && isSearchUnavailable;

	return (
		<main className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#070B14_0%,#101827_100%)] px-4 py-8 text-white sm:px-6 lg:px-10">
			<div className="mx-auto max-w-7xl">
				<section className="mb-6 overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950/55 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
					<div className="relative p-5 sm:p-7">
						<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
						<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:items-end">
							<div>
								<div className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold uppercase text-cyan-200">
									<UserRound size={14} />
									Riot profile search
								</div>
								<h1 className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl">
									Player Search
								</h1>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
									Search by exact Riot ID, then inspect ranked queues, champion mastery,
									and recent match history from Riot data.
								</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-3">
								<div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)_130px]">
									<Select value={region} onValueChange={(value) => setRegion(value as TRegion)}>
										<SelectTrigger className="h-11 w-full rounded-md border-cyan-300/25 bg-slate-950/70 text-cyan-50">
											<SelectValue placeholder="Region" />
										</SelectTrigger>
										<SelectContent>
											{REGIONS.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.value.toUpperCase()}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<div className="relative min-w-0">
										<Search
											className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
											size={18}
										/>
										<Input
											value={gameName}
											onChange={(event) => setGameName(event.target.value)}
											placeholder="Game name"
											className="h-11 rounded-md border-cyan-300/25 bg-slate-950/70 pl-10 text-cyan-50 focus-visible:ring-cyan-400/40"
										/>
									</div>
									<Input
										value={tagLine}
										onChange={(event) => setTagLine(event.target.value)}
										placeholder="Tagline"
										className="h-11 rounded-md border-cyan-300/25 bg-slate-950/70 text-cyan-50 focus-visible:ring-cyan-400/40"
									/>
								</div>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-h-5 text-xs text-slate-500">
										Use the Riot ID format: game name plus tagline, for example
										nerophase and NA1.
									</div>
									<Button
										type="submit"
										disabled={shouldDisableSearch}
										aria-disabled={isSearchUnavailable}
										className={`h-11 rounded-md border border-cyan-300/35 bg-cyan-500/90 px-5 font-bold text-slate-950 hover:bg-cyan-300 ${
											isSearchUnavailable ? "pointer-events-none opacity-50" : ""
										}`}
									>
										{isSearching ? (
											<Loader2 className="animate-spin" />
										) : (
											<Search />
										)}
										Search
									</Button>
								</div>
							</form>
						</div>
					</div>
				</section>

				{profileQuery.isError && (
					<section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-5 text-rose-100">
						<div className="flex items-start gap-3">
							<Target className="mt-0.5 shrink-0 text-rose-300" size={20} />
							<div>
								<h2 className="font-bold">Unable to load player</h2>
								<p className="mt-1 text-sm text-rose-100/80">{profileQuery.error.message}</p>
							</div>
						</div>
					</section>
				)}

				{!profileQuery.data && !profileQuery.isError && (
					<section className="rounded-lg border border-cyan-300/15 bg-slate-950/35 p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
							<Star size={28} />
						</div>
						<h2 className="mt-4 text-xl font-bold text-white">Ready for a Riot ID</h2>
						<p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
							Autocomplete is intentionally absent for this version because Riot does not
							provide partial public Riot ID discovery.
						</p>
					</section>
				)}

				{profileQuery.data && (
					<ProfileResult
						profile={profileQuery.data}
						matches={matches}
						hasMore={hasMore}
						isLoadingMore={isLoadingMore}
						onLoadMore={handleLoadMore}
					/>
				)}
			</div>
		</main>
	);
}
