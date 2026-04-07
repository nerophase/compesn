import axios from "axios";
import SignUpPageClient from "./page-client";
import { redirect } from "next/navigation";
import { ROUTES } from "@/environment";

type Params = Promise<{ provider: string; token: string }>;

export default async function SignUpPage({ searchParams }: { searchParams: Params }) {
	return redirect(ROUTES.client.authLogin);

	const { provider, token } = await searchParams;
	let signUpWithProvider = false;
	const data = {
		username: "",
		email: "",
	};

	if (provider === "discord") {
		const resp = await axios.get("https://discord.com/api/v10/users/@me", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		data.username = resp.data.username;
		data.email = resp.data.email;
		signUpWithProvider = true;
	}

	return (
		<SignUpPageClient
			data={data}
			signUpWithProvider={signUpWithProvider}
			accountProvider={provider}
		/>
	);
}
