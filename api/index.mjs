import { handleUpdate } from "../src/bot.mjs";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(200).send("Myke Visuals Bot is running.");
		return;
	}

	const update = req.body;

	// Acknowledge Telegram immediately — must respond within 10s or callback queries expire
	res.status(200).send("ok");

	// Process update after response is sent; Vercel keeps function alive until this resolves
	try {
		await handleUpdate(update);
	} catch (err) {
		console.error("[webhook error]", err.message);
	}
}
