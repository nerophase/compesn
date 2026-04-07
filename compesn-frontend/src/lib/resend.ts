import { env } from "@/environment";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
	const { error } = await resend.emails.send({
		from: "COMPESN <noreply@compesn.com>",
		to,
		subject,
		html,
	});

	if (error) {
		return false;
	}

	return true;
}
