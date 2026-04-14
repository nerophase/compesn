import nodemailer from "nodemailer";
import { logError } from "@compesn/shared/logging";
import { env } from "@/environment";

export async function sendMail(toEmail: string, subject: string, htmlTemplate: string) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: env.NODEMAILER_EMAIL,
			pass: env.NODEMAILER_PW,
		},
	});

	const mailOptions = {
		from: env.NODEMAILER_EMAIL,
		to: toEmail,
		subject: subject,
		html: htmlTemplate,
	};

	try {
		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		logError("backend.mail.send", error, { toEmail, subject });
		return false;
	}
}
