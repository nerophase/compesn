// Define a type representing all possible platform values used in REGIONS
export type TPlatform = (typeof PLATFORMS)[number];

// List of all platforms
export const PLATFORMS = ["americas", "europe", "asia", "sea"] as const;

// Unified regions data structure combining all region information
export const REGIONS = [
	{
		value: "br",
		label: "BR - Brazil",
		name: "Brazil",
		code: "BR1",
		platform: "americas",
	},
	{
		value: "eune",
		label: "EUNE - Europe Nordic & East",
		name: "Europe Nordic & East",
		code: "EUN1",
		platform: "europe",
	},
	{
		value: "euw",
		label: "EUW - Europe West",
		name: "Europe West",
		code: "EUW1",
		platform: "europe",
	},
	{
		value: "jp",
		label: "JP - Japan",
		name: "Japan",
		code: "JP1",
		platform: "asia",
	},
	{
		value: "lan",
		label: "LAN - Latin America North",
		name: "Latin America North",
		code: "LA1",
		platform: "americas",
	},
	{
		value: "las",
		label: "LAS - Latin America South",
		name: "Latin America South",
		code: "LA2",
		platform: "americas",
	},
	{
		value: "na",
		label: "NA - North America",
		name: "North America",
		code: "NA1",
		platform: "americas",
	},
	{
		value: "oce",
		label: "OCE - Oceania",
		name: "Oceania",
		code: "OC1",
		platform: "americas",
	},
	{
		value: "kr",
		label: "KR - Korea",
		name: "Korea",
		code: "KR",
		platform: "asia",
	},
	{
		value: "ru",
		label: "RU - Russia",
		name: "Russia",
		code: "RU",
		platform: "europe",
	},
	{
		value: "tr",
		label: "TR - Turkey",
		name: "Turkey",
		code: "TR1",
		platform: "europe",
	},
	{
		value: "me",
		label: "ME - Middle East",
		name: "Middle East",
		code: "ME1",
		platform: "europe",
	},
	{
		value: "ph",
		label: "PH - Philippines",
		name: "Philippines",
		code: "PH2",
		platform: "sea",
	},
	{
		value: "sg",
		label: "SG - Singapore",
		name: "Singapore",
		code: "SG2",
		platform: "sea",
	},
	{
		value: "th",
		label: "TH - Thailand",
		name: "Thailand",
		code: "TH2",
		platform: "sea",
	},
	{
		value: "tw",
		label: "TW - Taiwan",
		name: "Taiwan",
		code: "TW2",
		platform: "sea",
	},
	{
		value: "vn",
		label: "VN - Vietnam",
		name: "Vietnam",
		code: "VN2",
		platform: "sea",
	},
	{
		value: "pbe",
		label: "PBE - Public Beta Environment",
		name: "Public Beta Environment",
		code: "PBE1",
		platform: "americas",
	},
] as const;

// Legacy exports for backward compatibility and easy access patterns
export const regions = REGIONS.map((region) => ({
	code: region.code,
	name: region.name,
}));

export const regionToPlatform = Object.fromEntries(
	REGIONS.map((region) => [region.code, region.platform]),
) as Record<string, string>;

export const regionToName = Object.fromEntries(
	REGIONS.map((region) => [region.value, region.name]),
);
