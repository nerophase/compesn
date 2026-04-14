"use client";

import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import type { matchHistory } from "./match-history-data";

type HistoryMatch = (typeof matchHistory)[number];
type ComparableStatKey = "kda" | "cs" | "damage" | "gold" | "vision";
type ComparableStat = {
	key: ComparableStatKey;
	label: string;
	higherIsBetter: boolean;
	type?: string;
};

const statConfig = {
	"League of Legends": [
		{ key: "kda", label: "KDA", higherIsBetter: true, type: "kda" },
		{ key: "cs", label: "CS", higherIsBetter: true },
		{ key: "damage", label: "Damage", higherIsBetter: true },
		{ key: "gold", label: "Gold", higherIsBetter: true },
		{ key: "vision", label: "Vision Score", higherIsBetter: true },
	] satisfies ComparableStat[],
};

const parseKDA = (kda: string) => {
	const parts = kda.split("/").map(Number);
	if (parts.length !== 3) return 0;
	const [k, d, a] = parts;
	if (d === 0) return k + a;
	return (k + a) / d;
};

export const CrossReferencedStats = ({
	match1,
	match2,
}: {
	match1: HistoryMatch;
	match2: HistoryMatch;
}) => {
	const gameStats = statConfig["League of Legends"];

	const StatRow = ({
		stat,
	}: {
		stat: {
			key: ComparableStatKey;
			label: string;
			higherIsBetter: boolean;
			type?: string;
		};
	}) => {
		const rawValue1 = match1[stat.key] || "0";
		const rawValue2 = match2[stat.key] || "0";

		let v1, v2;
		if (stat.type === "kda") {
			v1 = parseKDA(rawValue1);
			v2 = parseKDA(rawValue2);
		} else {
			v1 = parseFloat(rawValue1.toString().replace(/,|%/g, ""));
			v2 = parseFloat(rawValue2.toString().replace(/,|%/g, ""));
		}

		const total = v1 + v2;
		const percentage1 = total > 0 ? (v1 / total) * 100 : 50;
		const percentage2 = total > 0 ? (v2 / total) * 100 : 50;

		const isV1Better = stat.higherIsBetter ? v1 > v2 : v1 < v2;
		const isV2Better = stat.higherIsBetter ? v2 > v1 : v2 < v1;

		return (
			<div className="flex flex-col gap-2 py-3 border-b border-gray-700/50 last:border-b-0">
				<div className="grid grid-cols-3 items-center text-center">
					<span
						className={`font-bold text-lg ${
							isV1Better ? "text-green-400" : "text-white"
						}`}
					>
						{rawValue1}
					</span>
					<span className="text-sm text-gray-400 font-medium uppercase tracking-wider">
						{stat.label}
					</span>
					<span
						className={`font-bold text-lg ${
							isV2Better ? "text-green-400" : "text-white"
						}`}
					>
						{rawValue2}
					</span>
				</div>
				<div className="flex items-center gap-1 w-full h-2 rounded-full overflow-hidden bg-gray-700">
					<motion.div
						className="h-full bg-blue-500"
						initial={{ width: "50%" }}
						animate={{ width: `${percentage1}%` }}
						transition={{ duration: 0.5, ease: "circOut" }}
					/>
					<motion.div
						className="h-full bg-red-500"
						initial={{ width: "50%" }}
						animate={{ width: `${percentage2}%` }}
						transition={{ duration: 0.5, ease: "circOut" }}
					/>
				</div>
			</div>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: "auto" }}
			className="mt-6 p-6 bg-gray-800/20 rounded-lg border border-gray-700 backdrop-blur-sm"
		>
			<div className="flex items-center justify-center gap-3 mb-4">
				<BarChart2 className="text-cyan-400" size={24} />
				<h4 className="text-cyan-300 font-bold text-xl text-center uppercase tracking-widest">
					Statistical Showdown
				</h4>
			</div>

			<div className="grid grid-cols-3 items-center text-center mb-4 px-4">
				<div className="font-bold text-lg text-blue-400">{match1.champion}</div>
				<div className="text-sm text-gray-500">vs</div>
				<div className="font-bold text-lg text-red-400">{match2.champion}</div>
			</div>

			<div>
				{gameStats.map((stat) => (
					<StatRow key={stat.key} stat={stat} />
				))}
			</div>
		</motion.div>
	);
};
