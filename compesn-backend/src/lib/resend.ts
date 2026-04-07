import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
	const { data, error } = await resend.emails.send({
		from: "COMPESN <noreply@compesn.com>",
		to,
		subject,
		html,
	});

	if (error) {
		return false;
		// return console.error({ error });
	}

	return true;
	// console.log({ data });
}
