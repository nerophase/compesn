const { configDotenv } = require("dotenv");
const nodemailer = require("nodemailer");
configDotenv();

//-----------------------------------------------------------------------------
async function sendMail(subject, toEmail, otpText) {
	console.log(process.env.NODEMAILER_EMAIL);
	console.log(process.env.NODEMAILER_PW);
	var transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.NODEMAILER_EMAIL,
			pass: process.env.NODEMAILER_PW,
		},
	});

	var mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: toEmail,
		subject: subject,
		text: otpText,
	};

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			throw new Error(error);
		} else {
			console.log("Email Sent");
			return true;
		}
	});
}

async function test() {
	sendMail("test subject", "iamstraxer44@gmail.com", "test");
}

test();
