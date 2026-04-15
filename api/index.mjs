import { handleUpdate, bot } from "../src/bot.mjs";

let botReady = false;

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(200).send("Myke Visuals Bot is running.");
		return;
	}

	// Init bot once per cold start (avoids top-level await blocking module load)
	if (!botReady) {
		try {
			await bot.init();
			botReady = true;
			console.log("[bot] initialized ok");
		} catch (err) {
			console.error("[bot] init failed:", err.message);
			res.status(500).send("bot init failed");
			return;
		}
	}

	const update = req.body;
	console.log("[webhook] received update:", JSON.stringify(update).slice(0, 200));

	// Acknowledge Telegram immediately — must respond within 10s or callback queries expire
	res.status(200).send("ok");

	// Process update after response is sent; Vercel keeps function alive until this resolves
	try {
		await handleUpdate(update);
	} catch (err) {
		console.error("[webhook error]", err.message, err.stack);
	}
}
