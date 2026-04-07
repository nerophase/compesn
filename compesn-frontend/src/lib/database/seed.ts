import "dotenv/config";
import { getDb } from "./index";
import * as schema from "@compesn/shared/common/schemas";
import bcrypt from "bcryptjs";

const db = getDb();

// Champion IDs mapping (based on Riot API standard IDs)
const CHAMPION_IDS = {
	Aatrox: 266,
	Ahri: 103,
	Akali: 84,
	Alistar: 12,
	Amumu: 32,
	Annie: 1,
	Aphelios: 523,
	Ashe: 22,
	AurelionSol: 136,
	Azir: 268,
	Bard: 432,
	Blitzcrank: 53,
	Brand: 63,
	Braum: 201,
	Caitlyn: 51,
	Camille: 164,
	Cassiopeia: 69,
	Chogath: 31,
	Corki: 42,
	Darius: 122,
	Diana: 131,
	Draven: 119,
	DrMundo: 36,
	Ekko: 245,
	Elise: 60,
	Evelynn: 28,
	Ezreal: 81,
	Fiddlesticks: 9,
	Fiora: 114,
	Fizz: 105,
	Galio: 3,
	Gangplank: 41,
	Garen: 86,
	Gnar: 150,
	Gragas: 79,
	Graves: 104,
	Gwen: 887,
	Hecarim: 120,
	Heimerdinger: 74,
	Illaoi: 420,
	Irelia: 39,
	Ivern: 427,
	Janna: 40,
	Jarvan: 59,
	Jax: 24,
	Jayce: 126,
	Jhin: 202,
	Jinx: 222,
	Kaisa: 145,
	Kalista: 429,
	Karma: 43,
	Karthus: 30,
	Kassadin: 38,
	Katarina: 55,
	Kayle: 10,
	Kayn: 141,
	Kennen: 85,
	Khazix: 121,
	Kindred: 203,
	Kled: 240,
	KogMaw: 96,
	Leblanc: 7,
	LeeSin: 64,
	Leona: 89,
	Lillia: 876,
	Lissandra: 127,
	Lucian: 236,
	Lulu: 117,
	Lux: 99,
	Malphite: 54,
	Malzahar: 90,
	Maokai: 57,
	MasterYi: 11,
	MissFortune: 21,
	MonkeyKing: 62,
	Mordekaiser: 82,
	Morgana: 25,
	Nami: 267,
	Nasus: 75,
	Nautilus: 111,
	Neeko: 518,
	Nidalee: 76,
	Nocturne: 56,
	Nunu: 20,
	Olaf: 2,
	Orianna: 61,
	Ornn: 516,
	Pantheon: 80,
	Poppy: 78,
	Pyke: 555,
	Qiyana: 246,
	Quinn: 133,
	Rakan: 497,
	Rammus: 33,
	RekSai: 421,
	Rell: 526,
	Renekton: 58,
	Rengar: 107,
	Riven: 92,
	Rumble: 68,
	Ryze: 13,
	Samira: 360,
	Sejuani: 113,
	Senna: 235,
	Seraphine: 147,
	Sett: 875,
	Shaco: 35,
	Shen: 98,
	Shyvana: 102,
	Singed: 27,
	Sion: 14,
	Sivir: 15,
	Skarner: 72,
	Sona: 37,
	Soraka: 16,
	Swain: 50,
	Sylas: 517,
	Syndra: 134,
	TahmKench: 223,
	Taliyah: 163,
	Talon: 91,
	Taric: 44,
	Teemo: 17,
	Thresh: 412,
	Tristana: 18,
	Trundle: 48,
	Tryndamere: 23,
	TwistedFate: 4,
	Twitch: 29,
	Udyr: 77,
	Urgot: 6,
	Varus: 110,
	Vayne: 67,
	Veigar: 45,
	Velkoz: 161,
	Vex: 711,
	Vi: 254,
	Viego: 234,
	Viktor: 112,
	Vladimir: 8,
	Volibear: 106,
	Warwick: 19,
	Xayah: 498,
	Xerath: 101,
	XinZhao: 5,
	Yasuo: 157,
	Yone: 777,
	Yorick: 83,
	Yuumi: 350,
	Zac: 154,
	Zed: 238,
	Zeri: 221,
	Ziggs: 115,
	Zilean: 26,
	Zoe: 142,
	Zyra: 143,
};

// Helper to generate random stats
function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomKDA(): { kills: number; deaths: number; assists: number } {
	return {
		kills: randomInt(0, 15),
		deaths: randomInt(0, 10),
		assists: randomInt(0, 20),
	};
}

async function seed() {
	console.log("🌱 Starting database seed...");

	try {
		// Hash password for all users
		const password = await bcrypt.hash("password123", 10);

		// 1. Create Users
		console.log("Creating users...");
		const users = await db
			.insert(schema.users)
			.values([
				{
					name: "ProPlayer1",
					email: "player1@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player1-puuid-123456789",
					riotGameName: "ProPlayer",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "MidLaneKing",
					email: "midlane@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player2-puuid-987654321",
					riotGameName: "MidLaneKing",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "JungleMain",
					email: "jungle@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player3-puuid-112233445",
					riotGameName: "JungleMain",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "ADCCarry",
					email: "adc@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player4-puuid-556677889",
					riotGameName: "ADCCarry",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "SupportGod",
					email: "support@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player5-puuid-998877665",
					riotGameName: "SupportGod",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "TopLaner99",
					email: "top@compesn.com",
					emailVerified: true,
					password,
					region: "euw",
					role: "player",
					puuid: "player6-puuid-123123123",
					riotGameName: "TopLaner99",
					riotTagLine: "EUW",
					primaryRegion: "euw",
				},
				{
					name: "EliteSupport",
					email: "elite@compesn.com",
					emailVerified: true,
					password,
					region: "euw",
					role: "player",
					puuid: "player7-puuid-456456456",
					riotGameName: "EliteSupport",
					riotTagLine: "EUW",
					primaryRegion: "euw",
				},
				{
					name: "MidOrFeed",
					email: "mid2@compesn.com",
					emailVerified: true,
					password,
					region: "euw",
					role: "player",
					puuid: "player8-puuid-789789789",
					riotGameName: "MidOrFeed",
					riotTagLine: "EUW",
					primaryRegion: "euw",
				},
				{
					name: "JungleDiff",
					email: "jungle2@compesn.com",
					emailVerified: true,
					password,
					region: "kr",
					role: "player",
					puuid: "player9-puuid-321321321",
					riotGameName: "JungleDiff",
					riotTagLine: "KR",
					primaryRegion: "kr",
				},
				{
					name: "BotLaneGG",
					email: "bot@compesn.com",
					emailVerified: true,
					password,
					region: "kr",
					role: "player",
					puuid: "player10-puuid-654654654",
					riotGameName: "BotLaneGG",
					riotTagLine: "KR",
					primaryRegion: "kr",
				},
				{
					name: "FlexPlayer",
					email: "flex@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "player11-puuid-111222333",
					riotGameName: "FlexPlayer",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
				{
					name: "ProCoach",
					email: "coach@compesn.com",
					emailVerified: true,
					password,
					region: "na",
					role: "player",
					puuid: "coach1-puuid-999888777",
					riotGameName: "ProCoach",
					riotTagLine: "NA1",
					primaryRegion: "na",
				},
			])
			.returning();
		console.log(`✅ Created ${users.length} users`);

		// 2. Create Teams
		console.log("Creating teams...");
		const teams = await db
			.insert(schema.teams)
			.values([
				{
					name: "Titans Esports",
					tag: "TTE",
					region: "na",
					currentRank: "DIAMOND",
					activityLevel: "COMPETITIVE",
					ownerId: users[0].id,
					lastActiveAt: new Date(),
					logoUrl: "https://example.com/titans-logo.png",
				},
				{
					name: "Phoenix Gaming",
					tag: "PHX",
					region: "na",
					currentRank: "PLATINUM",
					activityLevel: "REGULAR",
					ownerId: users[1].id,
					lastActiveAt: new Date(),
					logoUrl: "https://example.com/phoenix-logo.png",
				},
				{
					name: "Dragon Slayers",
					tag: "DRS",
					region: "euw",
					currentRank: "MASTER",
					activityLevel: "HARDCORE",
					ownerId: users[5].id,
					lastActiveAt: new Date(),
					logoUrl: "https://example.com/dragons-logo.png",
				},
				{
					name: "Lightning Strikes",
					tag: "LS",
					region: "kr",
					currentRank: "GRANDMASTER",
					activityLevel: "HARDCORE",
					ownerId: users[8].id,
					lastActiveAt: new Date(),
					logoUrl: "https://example.com/lightning-logo.png",
				},
				{
					name: "Casual Squad",
					tag: "CSQ",
					region: "na",
					currentRank: "GOLD",
					activityLevel: "CASUAL",
					ownerId: users[10].id,
					lastActiveAt: new Date(),
					logoUrl: "https://example.com/casual-logo.png",
				},
			])
			.returning();
		console.log(`✅ Created ${teams.length} teams`);

		// 3. Create Team Members
		console.log("Creating team members...");
		const teamMembers = await db
			.insert(schema.teamMembers)
			.values([
				// Titans Esports (Team 1) - Full roster
				{
					teamId: teams[0].id,
					userId: users[0].id,
					role: "TOP",
					joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
				},
				{
					teamId: teams[0].id,
					userId: users[2].id,
					role: "JUNGLE",
					joinedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[0].id,
					userId: users[1].id,
					role: "MID",
					joinedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[0].id,
					userId: users[3].id,
					role: "BOT",
					joinedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[0].id,
					userId: users[4].id,
					role: "SUPPORT",
					joinedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[0].id,
					userId: users[11].id,
					role: "COACH",
					joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
				},

				// Phoenix Gaming (Team 2) - Partial roster
				{
					teamId: teams[1].id,
					userId: users[1].id,
					role: "MID",
					joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[1].id,
					userId: users[2].id,
					role: "JUNGLE",
					joinedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[1].id,
					userId: users[10].id,
					role: "TOP",
					joinedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
				},

				// Dragon Slayers (Team 3) - Full roster
				{
					teamId: teams[2].id,
					userId: users[5].id,
					role: "TOP",
					joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[2].id,
					userId: users[6].id,
					role: "SUPPORT",
					joinedAt: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[2].id,
					userId: users[7].id,
					role: "MID",
					joinedAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
				},

				// Lightning Strikes (Team 4) - Full roster
				{
					teamId: teams[3].id,
					userId: users[8].id,
					role: "JUNGLE",
					joinedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[3].id,
					userId: users[9].id,
					role: "BOT",
					joinedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
				},

				// Casual Squad (Team 5) - Just owner
				{
					teamId: teams[4].id,
					userId: users[10].id,
					role: "TOP",
					joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				},
			])
			.returning();
		console.log(`✅ Created ${teamMembers.length} team members`);

		// 4. Create Scrims (both completed and upcoming)
		console.log("Creating scrims...");
		const scrims = await db
			.insert(schema.scrims)
			.values([
				// Completed scrims
				{
					creatingTeamId: teams[0].id,
					opponentTeamId: teams[1].id,
					status: "COMPLETED",
					startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
					durationMinutes: 35,
					bestOf: 1,
					winningTeamId: teams[0].id,
					matchDurationSeconds: 2100, // 35 minutes
					completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2100 * 1000),
					title: "Diamond Clash - Bo1",
					notes: "Good game, close match",
					commsLink: "https://discord.gg/example1",
					minRankTier: "PLATINUM",
					maxRankTier: "DIAMOND",
				},
				{
					creatingTeamId: teams[0].id,
					opponentTeamId: teams[2].id,
					status: "COMPLETED",
					startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
					durationMinutes: 42,
					bestOf: 3,
					winningTeamId: teams[2].id,
					matchDurationSeconds: 2520, // 42 minutes
					completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 2520 * 1000),
					title: "International Practice - Bo3 Game 1",
					notes: "Tough opponents, learned a lot",
					commsLink: "https://discord.gg/example2",
					minRankTier: "DIAMOND",
					maxRankTier: "MASTER",
				},
				{
					creatingTeamId: teams[1].id,
					opponentTeamId: teams[0].id,
					status: "COMPLETED",
					startTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
					durationMinutes: 28,
					bestOf: 1,
					winningTeamId: teams[0].id,
					matchDurationSeconds: 1680, // 28 minutes
					completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 1680 * 1000),
					title: "Friday Night Scrim",
					notes: "Quick game",
					commsLink: "https://discord.gg/example3",
					minRankTier: "PLATINUM",
					maxRankTier: "DIAMOND",
				},
				{
					creatingTeamId: teams[2].id,
					opponentTeamId: teams[3].id,
					status: "COMPLETED",
					startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
					durationMinutes: 38,
					bestOf: 1,
					winningTeamId: teams[3].id,
					matchDurationSeconds: 2280, // 38 minutes
					completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 2280 * 1000),
					title: "High Elo Practice",
					notes: "Amazing macro play from opponent",
					commsLink: "https://discord.gg/example4",
					minRankTier: "MASTER",
					maxRankTier: "GRANDMASTER",
				},
				{
					creatingTeamId: teams[0].id,
					opponentTeamId: teams[1].id,
					status: "COMPLETED",
					startTime: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
					durationMinutes: 31,
					bestOf: 1,
					winningTeamId: teams[1].id,
					matchDurationSeconds: 1860, // 31 minutes
					completedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000 + 1860 * 1000),
					title: "Midweek Practice",
					notes: "Good learning experience",
					commsLink: "https://discord.gg/example5",
					minRankTier: "PLATINUM",
					maxRankTier: "DIAMOND",
				},

				// Upcoming/Scheduled scrims
				{
					creatingTeamId: teams[0].id,
					opponentTeamId: teams[2].id,
					status: "ACCEPTED",
					startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
					durationMinutes: 60,
					bestOf: 3,
					title: "Weekend Tournament Prep",
					notes: "Bo3 practice for upcoming tournament",
					commsLink: "https://discord.gg/example6",
					minRankTier: "DIAMOND",
					maxRankTier: "MASTER",
				},
				{
					creatingTeamId: teams[1].id,
					status: "OPEN",
					startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
					durationMinutes: 60,
					bestOf: 1,
					title: "Looking for Platinum+ Team",
					notes: "Casual practice, any team welcome",
					commsLink: "https://discord.gg/example7",
					minRankTier: "PLATINUM",
					maxRankTier: "EMERALD",
					rolesNeeded: ["TOP", "BOT", "SUPPORT"],
				},
				{
					creatingTeamId: teams[3].id,
					status: "OPEN",
					startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
					durationMinutes: 90,
					bestOf: 5,
					title: "High Elo Bo5 Practice",
					notes: "Looking for Master+ team for serious practice",
					commsLink: "https://discord.gg/example8",
					minRankTier: "MASTER",
					maxRankTier: "CHALLENGER",
				},
			])
			.returning();
		console.log(`✅ Created ${scrims.length} scrims`);

		// 5. Create Scrim Participants (for completed scrims only)
		console.log("Creating scrim participants...");

		// Helper function to create participants for a scrim
		const createScrimParticipants = (
			scrimId: string,
			team1Id: string,
			team1Members: typeof users,
			team2Id: string,
			team2Members: typeof users,
			team1Won: boolean,
		) => {
			const team1Stats = team1Members.map((user, idx) => {
				const kda = randomKDA();
				const isWinner = team1Won;
				return {
					scrimId,
					userId: user.id,
					teamId: team1Id,
					championId:
						Object.values(CHAMPION_IDS)[
							randomInt(0, Object.values(CHAMPION_IDS).length - 1)
						],
					role: ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"][idx] as
						| "TOP"
						| "JUNGLE"
						| "MID"
						| "BOT"
						| "SUPPORT",
					kills: isWinner ? kda.kills + randomInt(2, 5) : kda.kills,
					deaths: isWinner ? kda.deaths : kda.deaths + randomInt(1, 3),
					assists: isWinner ? kda.assists + randomInt(3, 7) : kda.assists,
					totalCreepScore: randomInt(150, 350),
					goldEarned: randomInt(10000, 18000),
					visionScore: randomInt(20, 80),
					csAt10Minutes: randomInt(60, 100),
					totalDamageDealtToChampions: randomInt(15000, 35000),
					totalDamageTaken: randomInt(10000, 30000),
				};
			});

			const team2Stats = team2Members.map((user, idx) => {
				const kda = randomKDA();
				const isWinner = !team1Won;
				return {
					scrimId,
					userId: user.id,
					teamId: team2Id,
					championId:
						Object.values(CHAMPION_IDS)[
							randomInt(0, Object.values(CHAMPION_IDS).length - 1)
						],
					role: ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"][idx] as
						| "TOP"
						| "JUNGLE"
						| "MID"
						| "BOT"
						| "SUPPORT",
					kills: isWinner ? kda.kills + randomInt(2, 5) : kda.kills,
					deaths: isWinner ? kda.deaths : kda.deaths + randomInt(1, 3),
					assists: isWinner ? kda.assists + randomInt(3, 7) : kda.assists,
					totalCreepScore: randomInt(150, 350),
					goldEarned: randomInt(10000, 18000),
					visionScore: randomInt(20, 80),
					csAt10Minutes: randomInt(60, 100),
					totalDamageDealtToChampions: randomInt(15000, 35000),
					totalDamageTaken: randomInt(10000, 30000),
				};
			});

			return [...team1Stats, ...team2Stats];
		};

		// Scrim 1: Titans vs Phoenix (Titans won)
		const scrim1Participants = createScrimParticipants(
			scrims[0].id,
			teams[0].id,
			[users[0], users[2], users[1], users[3], users[4]], // Titans roster
			teams[1].id,
			[users[10], users[2], users[1], users[3], users[4]], // Phoenix roster (using some shared players)
			true, // Titans won
		);

		// Scrim 2: Titans vs Dragons (Dragons won)
		const scrim2Participants = createScrimParticipants(
			scrims[1].id,
			teams[0].id,
			[users[0], users[2], users[1], users[3], users[4]], // Titans roster
			teams[2].id,
			[users[5], users[6], users[7], users[5], users[6]], // Dragons roster
			false, // Dragons won
		);

		// Scrim 3: Phoenix vs Titans (Titans won)
		const scrim3Participants = createScrimParticipants(
			scrims[2].id,
			teams[1].id,
			[users[10], users[2], users[1], users[3], users[4]], // Phoenix roster
			teams[0].id,
			[users[0], users[2], users[1], users[3], users[4]], // Titans roster
			false, // Titans won
		);

		// Scrim 4: Dragons vs Lightning (Lightning won)
		const scrim4Participants = createScrimParticipants(
			scrims[3].id,
			teams[2].id,
			[users[5], users[6], users[7], users[5], users[6]], // Dragons roster
			teams[3].id,
			[users[8], users[9], users[8], users[9], users[8]], // Lightning roster
			false, // Lightning won
		);

		// Scrim 5: Titans vs Phoenix (Phoenix won)
		const scrim5Participants = createScrimParticipants(
			scrims[4].id,
			teams[0].id,
			[users[0], users[2], users[1], users[3], users[4]], // Titans roster
			teams[1].id,
			[users[10], users[2], users[1], users[3], users[4]], // Phoenix roster
			false, // Phoenix won
		);

		const allParticipants = [
			...scrim1Participants,
			...scrim2Participants,
			...scrim3Participants,
			...scrim4Participants,
			...scrim5Participants,
		];

		const participants = await db
			.insert(schema.scrimParticipants)
			.values(allParticipants)
			.returning();
		console.log(`✅ Created ${participants.length} scrim participants`);

		// 6. Create Scrim Drafts (for completed scrims)
		console.log("Creating scrim drafts...");
		const scrimDrafts = await db
			.insert(schema.scrimDrafts)
			.values([
				{
					scrimId: scrims[0].id,
					blueTeamId: teams[0].id,
					redTeamId: teams[1].id,
					status: "COMPLETED",
					bluePicks: [
						CHAMPION_IDS.Gnar,
						CHAMPION_IDS.LeeSin,
						CHAMPION_IDS.Orianna,
						CHAMPION_IDS.Jinx,
						CHAMPION_IDS.Thresh,
					],
					redPicks: [
						CHAMPION_IDS.Camille,
						CHAMPION_IDS.Graves,
						CHAMPION_IDS.Ahri,
						CHAMPION_IDS.Caitlyn,
						CHAMPION_IDS.Lux,
					],
					blueBans: [
						CHAMPION_IDS.Yasuo,
						CHAMPION_IDS.Zed,
						CHAMPION_IDS.Akali,
						CHAMPION_IDS.Leblanc,
						CHAMPION_IDS.Sylas,
					],
					redBans: [
						CHAMPION_IDS.Darius,
						CHAMPION_IDS.Khazix,
						CHAMPION_IDS.Syndra,
						CHAMPION_IDS.Aphelios,
						CHAMPION_IDS.Nautilus,
					],
					currentTurn: "RED_PICK_5",
					blueRoster: [
						users[0].puuid!,
						users[2].puuid!,
						users[1].puuid!,
						users[3].puuid!,
						users[4].puuid!,
					],
					redRoster: [
						users[10].puuid!,
						users[2].puuid!,
						users[1].puuid!,
						users[3].puuid!,
						users[4].puuid!,
					],
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
				{
					scrimId: scrims[1].id,
					blueTeamId: teams[0].id,
					redTeamId: teams[2].id,
					status: "COMPLETED",
					bluePicks: [
						CHAMPION_IDS.Jayce,
						CHAMPION_IDS.Elise,
						CHAMPION_IDS.Viktor,
						CHAMPION_IDS.Lucian,
						CHAMPION_IDS.Nami,
					],
					redPicks: [
						CHAMPION_IDS.Renekton,
						CHAMPION_IDS.Hecarim,
						CHAMPION_IDS.Azir,
						CHAMPION_IDS.Kalista,
						CHAMPION_IDS.Rakan,
					],
					blueBans: [
						CHAMPION_IDS.Aatrox,
						CHAMPION_IDS.Viego,
						CHAMPION_IDS.Cassiopeia,
						CHAMPION_IDS.Draven,
						CHAMPION_IDS.Leona,
					],
					redBans: [
						CHAMPION_IDS.Fiora,
						CHAMPION_IDS.Nidalee,
						CHAMPION_IDS.Ryze,
						CHAMPION_IDS.Ezreal,
						CHAMPION_IDS.Braum,
					],
					currentTurn: "RED_PICK_5",
					blueRoster: [
						users[0].puuid!,
						users[2].puuid!,
						users[1].puuid!,
						users[3].puuid!,
						users[4].puuid!,
					],
					redRoster: [
						users[5].puuid!,
						users[6].puuid!,
						users[7].puuid!,
						users[5].puuid!,
						users[6].puuid!,
					],
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
				{
					scrimId: scrims[2].id,
					blueTeamId: teams[1].id,
					redTeamId: teams[0].id,
					status: "COMPLETED",
					bluePicks: [
						CHAMPION_IDS.Sett,
						CHAMPION_IDS.Jarvan,
						CHAMPION_IDS.Syndra,
						CHAMPION_IDS.Ashe,
						CHAMPION_IDS.Zyra,
					],
					redPicks: [
						CHAMPION_IDS.Ornn,
						CHAMPION_IDS.Kayn,
						CHAMPION_IDS.Katarina,
						CHAMPION_IDS.Jhin,
						CHAMPION_IDS.Pyke,
					],
					blueBans: [
						CHAMPION_IDS.Irelia,
						CHAMPION_IDS.Ekko,
						CHAMPION_IDS.Zoe,
						CHAMPION_IDS.Vayne,
						CHAMPION_IDS.Blitzcrank,
					],
					redBans: [
						CHAMPION_IDS.Malphite,
						CHAMPION_IDS.Amumu,
						CHAMPION_IDS.Annie,
						CHAMPION_IDS.MissFortune,
						CHAMPION_IDS.Morgana,
					],
					currentTurn: "RED_PICK_5",
					blueRoster: [
						users[10].puuid!,
						users[2].puuid!,
						users[1].puuid!,
						users[3].puuid!,
						users[4].puuid!,
					],
					redRoster: [
						users[0].puuid!,
						users[2].puuid!,
						users[1].puuid!,
						users[3].puuid!,
						users[4].puuid!,
					],
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
			])
			.returning();
		console.log(`✅ Created ${scrimDrafts.length} scrim drafts`);

		// 7. Create Team Invites (some pending, some accepted)
		console.log("Creating team invites...");
		const teamInvites = await db
			.insert(schema.teamInvites)
			.values([
				{
					teamId: teams[1].id, // Phoenix Gaming
					inviterId: users[1].id,
					invitedUserId: users[5].id,
					role: "BOT",
					status: "PENDING",
				},
				{
					teamId: teams[1].id, // Phoenix Gaming
					inviterId: users[1].id,
					invitedUserId: users[6].id,
					role: "SUPPORT",
					status: "PENDING",
				},
				{
					teamId: teams[0].id, // Titans Esports
					inviterId: users[0].id,
					invitedUserId: users[10].id,
					role: "SUB",
					status: "ACCEPTED",
					expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
				},
				{
					teamId: teams[4].id, // Casual Squad
					inviterId: users[10].id,
					invitedUserId: users[3].id,
					role: "BOT",
					status: "PENDING",
				},
			])
			.returning();
		console.log(`✅ Created ${teamInvites.length} team invites`);

		console.log("\n🎉 Database seeding completed successfully!");
		console.log("\n📊 Summary:");
		console.log(`   - ${users.length} users`);
		console.log(`   - ${teams.length} teams`);
		console.log(`   - ${teamMembers.length} team members`);
		console.log(
			`   - ${scrims.length} scrims (${
				scrims.filter((s) => s.status === "COMPLETED").length
			} completed, ${scrims.filter((s) => s.status !== "COMPLETED").length} upcoming)`,
		);
		console.log(`   - ${participants.length} scrim participants`);
		console.log(`   - ${scrimDrafts.length} scrim drafts`);
		console.log(`   - ${teamInvites.length} team invites`);

		console.log("\n🔐 Test Credentials:");
		console.log("   Email: player1@compesn.com (or any other player email)");
		console.log("   Password: password123");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	} finally {
		process.exit(0);
	}
}

// Run the seed function
seed();
