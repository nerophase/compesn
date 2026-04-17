"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	BadgeCheck,
	BarChart3,
	CalendarClock,
	ChevronsRight,
	Clock3,
	Copy,
	Crown,
	Gamepad2,
	Hash,
	Loader2,
	Medal,
	Search,
	Shield,
	Skull,
	Sparkles,
	Target,
	Trophy,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import type {
	MatchLookupResponse,
	MatchPlayerSummary,
	MatchTeamSummary,
} from "@/trpc/routers/matches/matches.schema";

const MATCH_ID_PATTERN = /^[A-Z0-9]+_\d+$/;

const objectiveLabels: Array<{
	key: keyof MatchTeamSummary["objectives"];
	label: string;
	icon: ReactNode;
}> = [
	{ key: "dragon", label: "Drakes", icon: <Zap size={14} /> },
	{ key: "baron", label: "Barons", icon: <Crown size={14} /> },
	{ key: "riftHerald", label: "Heralds", icon: <Shield size={14} /> },
	{ key: "tower", label: "Towers", icon: <Target size={14} /> },
	{ key: "inhibitor", label: "Inhibs", icon: <Activity size={14} /> },
];

const formatDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	}

	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

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

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const getChampionImage = (championName: string) =>
	`https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/${championName}.png`;

const getPatchLabel = (gameVersion: string) => {
	const [major, minor] = gameVersion.split(".");
	return major && minor ? `${major}.${minor}` : gameVersion || "Unknown";
};

const getRoleLabel = (role: string) => {
	const normalized = role.toUpperCase();

	if (normalized === "BOTTOM") return "BOT";
	if (normalized === "UTILITY") return "SUPPORT";
	if (normalized === "NONE" || normalized === "UNKNOWN") return "FILL";

	return normalized;
};

const getTeamTheme = (side: "blue" | "red") =>
	side === "blue"
		? {
				name: "Blue Side",
				border: "border-cyan-400/35",
				panel: "from-cyan-500/15 via-slate-950/80 to-blue-950/55",
				accent: "text-cyan-300",
				line: "bg-cyan-400",
			}
		: {
				name: "Red Side",
				border: "border-rose-400/35",
				panel: "from-rose-500/15 via-slate-950/80 to-red-950/55",
				accent: "text-rose-300",
				line: "bg-rose-400",
			};

function InfoPill({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string | number;
}) {
	return (
		<div className="min-w-0 rounded-md border border-cyan-400/15 bg-slate-950/55 px-3 py-2">
			<div className="flex items-center gap-2 text-[11px] uppercase text-slate-500">
				{icon}
				<span>{label}</span>
			</div>
			<div className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</div>
		</div>
	);
}

function PlayerRow({ player }: { player: MatchPlayerSummary }) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-white/10 bg-slate-950/45 p-3 transition-colors hover:bg-slate-900/70 md:grid-cols-[minmax(220px,1fr)_76px_72px_72px_72px]">
			<div className="flex min-w-0 items-center gap-3">
				<div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-white/15 bg-slate-900">
					<Image
						src={getChampionImage(player.championName)}
						alt={player.championName}
						width={44}
						height={44}
						className="size-full object-cover"
					/>
				</div>
				<div className="min-w-0">
					<div className="truncate text-sm font-semibold text-white">
						{player.displayName}
					</div>
					<div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
						<span className="truncate">{player.championName}</span>
						<span className="text-slate-600">/</span>
						<span>{getRoleLabel(player.role)}</span>
					</div>
				</div>
			</div>

			<div className="text-right">
				<div className="text-sm font-bold text-white">
					{player.kills}/{player.deaths}/{player.assists}
				</div>
				<div className="text-xs text-cyan-300">{player.kda} KDA</div>
			</div>

			<div className="hidden text-right md:block">
				<div className="text-sm font-semibold text-white">
					{formatNumber(player.creepScore)}
				</div>
				<div className="text-xs text-slate-500">CS</div>
			</div>
			<div className="hidden text-right md:block">
				<div className="text-sm font-semibold text-white">
					{formatNumber(player.goldEarned)}
				</div>
				<div className="text-xs text-slate-500">Gold</div>
			</div>
			<div className="hidden text-right md:block">
				<div className="text-sm font-semibold text-white">
					{formatNumber(player.damageToChampions)}
				</div>
				<div className="text-xs text-slate-500">Damage</div>
			</div>
		</div>
	);
}

function TeamPanel({ team }: { team: MatchTeamSummary }) {
	const theme = getTeamTheme(team.side);

	return (
		<section
			className={`relative overflow-hidden rounded-lg border ${theme.border} bg-gradient-to-br ${theme.panel}`}
		>
			<div className={`absolute left-0 top-0 h-full w-1 ${theme.line}`} />
			<div className="border-b border-white/10 p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<div className={`text-sm font-semibold uppercase ${theme.accent}`}>
							{theme.name}
						</div>
						<div className="mt-2 flex items-center gap-2">
							{team.win ? (
								<Trophy className="text-yellow-300" size={22} />
							) : (
								<Skull className="text-slate-500" size={22} />
							)}
							<span className="text-2xl font-black text-white">
								{team.win ? "VICTORY" : "DEFEAT"}
							</span>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2 text-right">
						<div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
							<div className="text-xl font-bold text-white">{team.totalKills}</div>
							<div className="text-xs text-slate-400">Kills</div>
						</div>
						<div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
							<div className="text-xl font-bold text-white">
								{team.participantCount}
							</div>
							<div className="text-xs text-slate-400">Players</div>
						</div>
					</div>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
					{objectiveLabels.map(({ key, label, icon }) => {
						const objective = team.objectives[key];
						const kills = objective?.kills ?? 0;

						return (
							<div
								key={key}
								className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-center"
							>
								<div className="flex items-center justify-center gap-1 text-slate-400">
									{icon}
									<span className="text-[11px]">{label}</span>
								</div>
								<div className="mt-1 text-lg font-bold text-white">{kills}</div>
							</div>
						);
					})}
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-2">
					<span className="text-xs uppercase text-slate-500">Bans</span>
					{team.bans.length > 0 ? (
						team.bans.map((ban) => (
							<span
								key={`${team.side}-${ban.championId}-${ban.pickTurn ?? "x"}`}
								className="rounded-md border border-white/10 bg-slate-950/55 px-2 py-1 text-xs font-semibold text-slate-200"
							>
								#{ban.championId}
							</span>
						))
					) : (
						<span className="text-xs text-slate-500">No bans recorded</span>
					)}
				</div>
			</div>

			<div className="space-y-2 p-4">
				{team.players.map((player) => (
					<PlayerRow
						key={`${team.side}-${player.participantId}-${player.puuid}`}
						player={player}
					/>
				))}
			</div>
		</section>
	);
}

function ResultSummary({ match }: { match: MatchLookupResponse }) {
	const winner = match.winningSide ? getTeamTheme(match.winningSide).name : "No winner recorded";

	return (
		<div className="space-y-6">
			<section className="rounded-lg border border-cyan-300/25 bg-slate-950/70 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
				<div className="border-b border-cyan-300/15 bg-gradient-to-r from-cyan-500/15 via-slate-900/20 to-rose-500/15 p-5">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2 text-xs uppercase text-cyan-300">
								<BadgeCheck size={15} />
								<span>Completed match</span>
								<ChevronsRight size={14} />
								<span>{winner}</span>
							</div>
							<h2 className="mt-3 break-all text-2xl font-black text-white md:text-3xl">
								{match.matchId}
							</h2>
						</div>
						<div className="flex flex-wrap gap-2">
							<span className="rounded-md border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-sm font-bold text-yellow-200">
								{match.queueLabel}
							</span>
							<span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100">
								Patch {getPatchLabel(match.gameVersion)}
							</span>
						</div>
					</div>
				</div>

				<div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
					<InfoPill icon={<Hash size={14} />} label="Game ID" value={match.gameId} />
					<InfoPill
						icon={<Clock3 size={14} />}
						label="Duration"
						value={formatDuration(match.gameDuration)}
					/>
					<InfoPill
						icon={<CalendarClock size={14} />}
						label="Started"
						value={formatDate(match.gameStartTimestamp ?? match.gameCreation)}
					/>
					<InfoPill
						icon={<Gamepad2 size={14} />}
						label="Mode"
						value={`${match.gameMode} / ${match.gameType}`}
					/>
				</div>

				{match.tournamentCode && (
					<div className="px-5 pb-5">
						<div className="rounded-md border border-cyan-300/15 bg-black/20 px-3 py-2 text-sm text-slate-300">
							<span className="text-slate-500">Tournament code:</span>{" "}
							<span className="break-all font-mono text-cyan-200">
								{match.tournamentCode}
							</span>
						</div>
					</div>
				)}
			</section>

			<div className="grid gap-5 xl:grid-cols-2">
				{match.teams.map((team) => (
					<TeamPanel key={team.side} team={team} />
				))}
			</div>
		</div>
	);
}

export default function GameResultPageClient() {
	const trpc = useTRPC();
	const [matchIdInput, setMatchIdInput] = useState("");
	const [submittedMatchId, setSubmittedMatchId] = useState<string | null>(null);

	const normalizedMatchId = useMemo(() => matchIdInput.trim().toUpperCase(), [matchIdInput]);
	const validationMessage =
		normalizedMatchId.length > 0 && !MATCH_ID_PATTERN.test(normalizedMatchId)
			? "Use a Riot Match-V5 ID like NA1_1234567890."
			: null;

	const matchQuery = useQuery(
		trpc.matches.getByMatchId.queryOptions(
			{ matchId: submittedMatchId ?? "NA1_0" },
			{
				enabled: submittedMatchId !== null,
				retry: false,
			},
		),
	);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!MATCH_ID_PATTERN.test(normalizedMatchId)) {
			return;
		}

		setSubmittedMatchId(normalizedMatchId);
	};

	const handleCopy = async () => {
		if (!matchQuery.data) return;

		await navigator.clipboard.writeText(matchQuery.data.matchId);
		toast.success("Match ID copied.");
	};

	return (
		<main className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#070B14_0%,#101827_100%)] px-4 py-8 text-white sm:px-6 lg:px-10">
			<div className="mx-auto max-w-7xl">
				<section className="mb-6 overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-950/55 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
					<div className="relative p-5 sm:p-7">
						<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
						<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-end">
							<div>
								<div className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold uppercase text-cyan-200">
									<Sparkles size={14} />
									Riot Match-V5 Lookup
								</div>
								<h1 className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl">
									Game Result Lookup
								</h1>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
									Enter a completed League match ID to pull the official result,
									scoreline, objectives, bans, and team rosters.
								</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-2">
								<div className="flex flex-col gap-2 sm:flex-row">
									<div className="relative min-w-0 flex-1">
										<Search
											className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
											size={18}
										/>
										<Input
											value={matchIdInput}
											onChange={(event) =>
												setMatchIdInput(event.target.value)
											}
											placeholder="NA1_1234567890"
											className="h-11 rounded-md border-cyan-300/25 bg-slate-950/70 pl-10 font-mono uppercase text-cyan-50 placeholder:font-sans placeholder:normal-case focus-visible:ring-cyan-400/40"
											aria-invalid={validationMessage ? "true" : "false"}
										/>
									</div>
									<Button
										type="submit"
										disabled={
											!!validationMessage ||
											normalizedMatchId.length === 0 ||
											matchQuery.isFetching
										}
										className="h-11 rounded-md border border-cyan-300/35 bg-cyan-500/90 px-5 font-bold text-slate-950 hover:bg-cyan-300"
									>
										{matchQuery.isFetching ? (
											<Loader2 className="animate-spin" />
										) : (
											<Search />
										)}
										Lookup
									</Button>
								</div>
								<div className="min-h-5 text-xs text-slate-500">
									{validationMessage ? (
										<span className="text-amber-300">{validationMessage}</span>
									) : (
										<span>
											Match IDs include the platform prefix, for example NA1
											or EUW1.
										</span>
									)}
								</div>
							</form>
						</div>
					</div>
				</section>

				{matchQuery.isError && (
					<section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-5 text-rose-100">
						<div className="flex items-start gap-3">
							<Medal className="mt-0.5 shrink-0 text-rose-300" size={20} />
							<div>
								<h2 className="font-bold">Unable to load match</h2>
								<p className="mt-1 text-sm text-rose-100/80">
									{matchQuery.error.message}
								</p>
							</div>
						</div>
					</section>
				)}

				{!matchQuery.data && !matchQuery.isError && (
					<section className="rounded-lg border border-cyan-300/15 bg-slate-950/35 p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
							<BarChart3 size={28} />
						</div>
						<h2 className="mt-4 text-xl font-bold text-white">Ready for a match ID</h2>
						<p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
							The lookup runs only after a valid Riot Match-V5 ID is submitted,
							keeping Riot API calls deliberate.
						</p>
					</section>
				)}

				{matchQuery.data && (
					<div className="space-y-3">
						<div className="flex justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={handleCopy}
								className="rounded-md border-cyan-300/25 bg-slate-950/60 text-cyan-100 hover:bg-cyan-300/10"
							>
								<Copy />
								Copy Match ID
							</Button>
						</div>
						<ResultSummary match={matchQuery.data} />
					</div>
				)}
			</div>
		</main>
	);
}
