import { handleUpdate } from "../src/bot.js";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(200).send("Myke Visuals Bot is running.");
		return;
	}

	try {
		const update = req.body;
		await handleUpdate(update);
		res.status(200).send("ok");
	} catch (err) {
		console.error("[webhook error]", err.message);
		res.status(500).send("error");
	}
}
