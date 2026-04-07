import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const LOCAL_COMMON_IMPORT = /from\s+["'](?:@\/common|\.{1,2}\/common|\.{1,2}\/[^"']*\/common)/;

const walk = (directory: string): string[] =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const resolved = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			return walk(resolved);
		}

		return /\.ts$/.test(entry.name) ? [resolved] : [];
	});

test("backend source imports shared contracts instead of local src/common copies", () => {
	const offenders = walk(SOURCE_ROOT)
		.filter((file) => !file.includes(`${path.sep}src${path.sep}common${path.sep}`))
		.filter((file) => !file.endsWith(".test.ts"))
		.filter((file) => LOCAL_COMMON_IMPORT.test(fs.readFileSync(file, "utf8")))
		.map((file) => path.relative(process.cwd(), file));

	assert.deepEqual(offenders, []);
});
