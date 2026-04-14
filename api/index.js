import { handleUpdate } from "../src/bot.js";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(200).send("Myke Visuals Bot is running.");
		return;
	}

	try {
		await handleUpdate(req, res);
	} catch (err) {
		console.error("[webhook error]", err.message);
		res.status(500).send("error");
	}
}
