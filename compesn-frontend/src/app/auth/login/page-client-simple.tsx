"use client";

import LoginPanel from "@/components/auth/login-panel";
import { useSearchParams } from "next/navigation";

export default function LoginPageClientSimple() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	const callbackUrl = searchParams.get("callbackUrl") || "/";

	return (
		<div className="mx-auto w-full max-w-md px-4 py-8">
			<LoginPanel callbackUrl={callbackUrl} error={error} />
		</div>
	);
}
