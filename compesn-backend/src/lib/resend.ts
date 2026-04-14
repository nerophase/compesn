import { Resend } from "resend";
import { env } from "@/environment";
import { logError } from "@compesn/shared/logging";

const resend = new Resend(env.RESEND_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
	const { error } = await resend.emails.send({
		from: "COMPESN <noreply@compesn.com>",
		to,
		subject,
		html,
	});

	if (error) {
		logError("backend.resend.send", error, { to, subject });
		return false;
	}

	return true;
}
