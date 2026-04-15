import { handleUpdate, bot } from "../src/bot.mjs";

let botReady = false;

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(200).send("Myke Visuals Bot is running.");
		return;
	}

	// Init bot once per cold start
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

	// Process fully first, THEN respond — Vercel terminates function on res.send()
	try {
		await handleUpdate(update);
		console.log("[webhook] update handled ok");
	} catch (err) {
		console.error("[webhook error]", err.message, err.stack);
	}

	res.status(200).send("ok");
}
