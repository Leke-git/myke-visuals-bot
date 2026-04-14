import OpenAI from "openai";
import { getStudio, formatServiceList } from "./knowledge.js";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: process.env.OPENAI_BASE_URL
});

const MODEL = () => process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

export async function classifyIntent({ text, history = [] }) {
	const studio = getStudio();
	const services = formatServiceList();

	const system = `
You are the booking assistant for ${studio.name}, a professional photography studio in Abuja, Nigeria run by ${studio.photographer} (@${studio.instagram}, 70K followers).

Services offered:
${services}

Studio: ${studio.address}
Hours: ${studio.hours}
Phone: ${studio.phone}

Classify the user message into one intent. Return JSON only — no preamble, no markdown:
{
  "intent": "BOOK" | "SERVICES" | "PORTFOLIO" | "FAQ" | "PRICING" | "HANDOFF" | "GREETING" | "GENERAL",
  "faqQuery": string | null,
  "reply": string | null
}

Intent rules:
- BOOK: wants to book, schedule, or reserve a session
- SERVICES: wants to know what services are available
- PORTFOLIO: wants to see work, samples, examples
- FAQ: question about deposit, turnaround, location, hours, outfits, payment, editing
- PRICING: asks about cost/price/how much without a specific service in mind
- HANDOFF: wants to speak to a human, has a complaint, urgent request
- GREETING: hello, hi, hey, start
- GENERAL: anything else — write a warm helpful reply in the "reply" field

For GENERAL and GREETING, always write a friendly reply in the "reply" field.
For all other intents, set "reply" to null.
`.trim();

	const result = await openai.chat.completions.create({
		model: MODEL(),
		messages: [
			{ role: "system", content: system },
			...history.slice(-6),
			{ role: "user", content: text }
		],
		response_format: { type: "json_object" }
	});

	try {
		return JSON.parse(result.choices[0].message.content);
	} catch {
		return { intent: "GENERAL", reply: "How can I help you? Tap the menu below to get started 👇" };
	}
}

export async function extractBookingFields({ text }) {
	const system = `
Extract booking details from the user's message.
Return JSON only — no preamble, no markdown:
{
  "date": "YYYY-MM-DD" | null,
  "time": "HH:mm" | null,
  "name": string | null,
  "notes": string | null,
  "cancel": boolean
}
Rules:
- Interpret relative dates like "tomorrow", "next Friday" using timezone: Africa/Lagos
- Convert times like "2pm" to "14:00"
- If user wants to cancel, set cancel: true
- Today's date: ${new Date().toISOString().split("T")[0]}
- If no value found, use null
`.trim();

	const result = await openai.chat.completions.create({
		model: MODEL(),
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: text }
		],
		response_format: { type: "json_object" }
	});

	try {
		return JSON.parse(result.choices[0].message.content);
	} catch {
		return {};
	}
}
