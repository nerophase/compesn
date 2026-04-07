import assert from "node:assert/strict";
import test from "node:test";
import { isAuthBypassEnabled, resolveAuthBypassIdentifier } from "./auth-bypass-utils";

test("auth bypass stays disabled in production even if the flag is enabled", () => {
	assert.equal(isAuthBypassEnabled("production", true), false);
	assert.equal(isAuthBypassEnabled("development", true), true);
});

test("submitted username takes precedence over the default bypass identifier", () => {
	assert.equal(resolveAuthBypassIdentifier("TestUser", "fallback@example.com"), "TestUser");
});

test("default bypass identifier is used when the submitted username is blank", () => {
	assert.equal(resolveAuthBypassIdentifier("   ", "fallback@example.com"), "fallback@example.com");
	assert.equal(resolveAuthBypassIdentifier("", undefined), "");
});
