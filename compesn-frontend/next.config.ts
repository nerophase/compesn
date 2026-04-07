import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(projectRoot, "..");

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@compesn/shared"],
	turbopack: {
		root: workspaceRoot,
	},
	images: {
		remotePatterns: [
			{
				hostname: "localhost",
			},
			{
				hostname: "www.compesn.com",
			},
			{
				hostname: "api.compesn.com",
			},
			{
				hostname: "localapi.compesn.com",
			},
			{
				hostname: "compesn.com",
			},
		],
		unoptimized: true,
	},
	outputFileTracingRoot: workspaceRoot,
	allowedDevOrigins: ["localhost", "localhost:3000", "localhost:5000", "local.compesn.com"],
};

export default nextConfig;
