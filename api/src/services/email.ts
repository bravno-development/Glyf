import { sgMail } from "../../imports.ts";

const DENO_ENV = Deno.env.get("DENO_ENV") ?? "development";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@bravno.com";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

const isDevelopment = DENO_ENV === "development";
const sendgridConfigured = Boolean(SENDGRID_API_KEY);

if (SENDGRID_API_KEY) {
	sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendMagicLinkEmail(
	email: string,
	token: string,
	code: string,
): Promise<void> {
	const link = `${APP_URL}/auth/verify?token=${token}`;

	if (!sendgridConfigured || isDevelopment) {
		console.log("──────────────────────────────────");
		console.log(`Magic link for ${email}`);
		console.log(`  Code: ${code}`);
		console.log(`  Link: ${link}`);
		console.log("──────────────────────────────────");
		return;
	}

	await sgMail.send({
		from: SMTP_FROM,
		to: email,
		subject: "Your Glyf login code",
		text: [
			`Your login code is: ${code}`,
			"",
			"Enter this code in the app, or click the link below:",
			link,
			"",
			"This code expires in 15 minutes.",
		].join("\n"),
		html: [
			"<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\">",
			"<h2>Your login code</h2>",
			`<p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;margin:24px 0">${code}</p>`,
			"<p>Enter this code in the app, or click the button below:</p>",
			`<p style="text-align:center;margin:24px 0"><a href="${link}" style="background:#4CAF50;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:500">Log in to Glyf</a></p>`,
			"<p style=\"color:#666;font-size:13px\">This code expires in 15 minutes.</p>",
			"</div>",
		].join("\n"),
	});
}

export async function sendStudyReminderEmail(
	email: string,
	appUrl: string = APP_URL,
): Promise<void> {
	const link = `${appUrl}/dashboard`;

	if (!sendgridConfigured || isDevelopment) {
		console.log("──────────────────────────────────");
		console.log(`Study reminder for ${email}`);
		console.log(`  Link: ${link}`);
		console.log("──────────────────────────────────");
		return;
	}

	await sgMail.send({
		from: SMTP_FROM,
		to: email,
		subject: "Time to study — Glyf",
		text: [
			"It's time for your daily practice.",
			"",
			"Open the app and keep learning:",
			link,
		].join("\n"),
		html: [
			"<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\">",
			"<h2>Time to study</h2>",
			"<p>It's time for your daily practice. Open the app and keep learning.</p>",
			`<p style="text-align:center;margin:24px 0"><a href="${link}" style="background:#5749F4;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:500">Open Glyf</a></p>`,
			"</div>",
		].join("\n"),
	});
}
