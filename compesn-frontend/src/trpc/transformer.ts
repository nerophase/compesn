import type { DataTransformer } from "@trpc/server/unstable-core-do-not-import";
import { parse, stringify } from "devalue";

export const transformer: DataTransformer = {
	deserialize: (object: string) => parse(object),
	serialize: (object: unknown) => stringify(object),
};
