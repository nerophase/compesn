import type { DataTransformer } from "@trpc/server/unstable-core-do-not-import";
import { parse, stringify } from "devalue";

export const transformer: DataTransformer = {
	deserialize: (object: any) => parse(object),
	serialize: (object: any) => stringify(object),
};
