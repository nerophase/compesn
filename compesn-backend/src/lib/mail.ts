import nodemailer from "nodemailer";

export async function sendMail(toEmail: string, subject: string, htmlTemplate: string) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.NODEMAILER_EMAIL,
			pass: process.env.NODEMAILER_PW,
		},
	});

	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: toEmail,
		subject: subject,
		html: htmlTemplate,
	};

	try {
		await transporter.sendMail(mailOptions);
		return true;
	} catch (error: any) {
		console.error("Error sending email: ", error.message);
	}
}
