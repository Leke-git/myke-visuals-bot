import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { getSession, setSession, clearSession } from "./store.mjs";
import { classifyIntent, extractBookingFields } from "./agent.mjs";
import { logEvent } from "./analytics.mjs";
import { lookupFaq, getServices, getServiceById, formatServiceDetail, getStudio } from "./knowledge.mjs";
import {
	missingBookingFields,
	nextBookingQuestion,
	mergeDraft,
	saveBooking,
	formatConfirmation
} from "./booking.mjs";
import {
	missingMasterclassFields,
	nextMasterclassQuestion,
	parseExperienceLevel,
	mergeMasterclassDraft,
	saveMasterclassRegistration,
	formatMasterclassConfirmation,
	masterclassInfo
} from "./masterclass.mjs";

if (!process.env.BOT_TOKEN) throw new Error("Missing BOT_TOKEN");

export const bot = new Bot(process.env.BOT_TOKEN);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function safeAnswer(ctx) {
	try {
		await ctx.answerCallbackQuery();
	} catch {
		// Query expired or invalid — safe to ignore
	}
}

// ── Keyboards ─────────────────────────────────────────────────────────────────

function mainMenuKeyboard() {
	return new InlineKeyboard()
		.text("🎓 Unleash Your Creativity", "masterclass")
		.row()
		.text("📷 Book a Session", "book")
		.text("🎨 Our Services", "services")
		.row()
		.text("🖼 Portfolio", "portfolio")
		.text("❓ FAQs", "faqs")
		.row()
		.text("💰 Pricing", "pricing")
		.text("📞 Contact Us", "contact");
}

function masterclassKeyboard() {
	return new InlineKeyboard()
		.text("✍️ Sign Me Up!", "masterclass_signup")
		.row()
		.text("⬅️ Back to Menu", "menu");
}

function servicesKeyboard() {
	const services = getServices();
	const kb = new InlineKeyboard();
	services.forEach((s, i) => {
		kb.text(s.name, `service_${s.id}`);
		if (i % 2 === 1) kb.row();
	});
	kb.row().text("⬅️ Back to Menu", "menu");
	return kb;
}

function bookServiceKeyboard() {
	const services = getServices();
	const kb = new InlineKeyboard();
	services.forEach((s, i) => {
		kb.text(s.name, `book_${s.id}`);
		if (i % 2 === 1) kb.row();
	});
	kb.row().text("⬅️ Back", "menu");
	return kb;
}

function cancelKeyboard() {
	return new InlineKeyboard().text("❌ Cancel Booking", "cancel");
}

function faqKeyboard() {
	return new InlineKeyboard()
		.text("💳 Deposit & Booking", "faq_deposit")
		.row()
		.text("⏱ Turnaround Time", "faq_turnaround")
		.row()
		.text("📍 Location", "faq_location")
		.text("🕐 Hours", "faq_hours")
		.row()
		.text("👗 What to Wear", "faq_outfits")
		.text("🎨 Editing", "faq_editing")
		.row()
		.text("💳 Payment Methods", "faq_payment")
		.row()
		.text("⬅️ Back to Menu", "menu");
}

// ── Welcome ───────────────────────────────────────────────────────────────────

async function sendWelcome(ctx) {
	const studio = getStudio();
	const name = ctx.from?.first_name ?? "there";
	await ctx.reply(
		`👋 Hey ${name}! Welcome to *${studio.name}* 📸\n\n` +
		`I'm your booking assistant for Abuja's creative photography studio.\n\n` +
		`What would you like to do today?`,
		{ parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
	);
}

// ── Commands ──────────────────────────────────────────────────────────────────

bot.command("start", async (ctx) => {
	await clearSession(ctx.from.id);
	await logEvent({ userId: ctx.from.id, event: "START" });
	await sendWelcome(ctx);
});

bot.command("menu", async (ctx) => {
	await ctx.reply("Here's the main menu 👇", {
		reply_markup: mainMenuKeyboard()
	});
});

bot.command("restart", async (ctx) => {
	await clearSession(ctx.from.id);
	await sendWelcome(ctx);
});

// ── Callback queries ──────────────────────────────────────────────────────────

bot.callbackQuery("menu", async (ctx) => {
	await safeAnswer(ctx);
	await ctx.editMessageText("Here's the main menu 👇", {
		reply_markup: mainMenuKeyboard()
	});
});

bot.callbackQuery("services", async (ctx) => {
	await safeAnswer(ctx);
	await logEvent({ userId: ctx.from.id, event: "VIEW_SERVICES" });
	await ctx.editMessageText(
		`🎨 *Myke Visuals Services*\n\nTap a service to learn more:`,
		{ parse_mode: "Markdown", reply_markup: servicesKeyboard() }
	);
});

bot.callbackQuery("portfolio", async (ctx) => {
	await safeAnswer(ctx);
	await logEvent({ userId: ctx.from.id, event: "VIEW_PORTFOLIO" });
	await ctx.editMessageText(
		`📸 *Myke Visuals Portfolio*\n\n` +
		`Check out our work:\n\n` +
		`👉 Instagram: @mykevisuals\nhttps://instagram.com/mykevisuals\n\n` +
		`👉 Studio: @myke\\_studios\nhttps://instagram.com/myke_studios\n\n` +
		`With 70K+ followers and 500+ posts — there's a lot to explore! 🎨`,
		{
			parse_mode: "Markdown",
			reply_markup: new InlineKeyboard()
				.text("📷 Book a Session", "book")
				.text("⬅️ Back", "menu")
		}
	);
});

bot.callbackQuery("pricing", async (ctx) => {
	await safeAnswer(ctx);
	await logEvent({ userId: ctx.from.id, event: "VIEW_PRICING" });
	const services = getServices();
	const list = services
		.map((s) => `• *${s.name}* — from ₦${s.price_from.toLocaleString()}`)
		.join("\n");
	await ctx.editMessageText(
		`💰 *Pricing Overview*\n\n${list}\n\n_Tap a service for full details and to book._`,
		{ parse_mode: "Markdown", reply_markup: servicesKeyboard() }
	);
});

bot.callbackQuery("faqs", async (ctx) => {
	await safeAnswer(ctx);
	await ctx.editMessageText(
		`❓ *Frequently Asked Questions*\n\nTap a topic below:`,
		{ parse_mode: "Markdown", reply_markup: faqKeyboard() }
	);
});

bot.callbackQuery("contact", async (ctx) => {
	await safeAnswer(ctx);
	const studio = getStudio();
	await ctx.editMessageText(
		`📞 *Contact Myke Visuals*\n\n` +
		`📱 Phone: ${studio.phone}\n` +
		`📧 Email: ${studio.email}\n` +
		`📍 ${studio.address}\n` +
		`🕐 ${studio.hours}\n\n` +
		`📸 @mykevisuals | @myke\\_studios`,
		{
			parse_mode: "Markdown",
			reply_markup: new InlineKeyboard()
				.text("📷 Book a Session", "book")
				.text("⬅️ Back", "menu")
		}
	);
});

// ── Masterclass callbacks ─────────────────────────────────────────────────────

bot.callbackQuery("masterclass", async (ctx) => {
	await safeAnswer(ctx);
	await logEvent({ userId: ctx.from.id, event: "VIEW_MASTERCLASS" });
	await ctx.editMessageText(masterclassInfo(), {
		parse_mode: "Markdown",
		reply_markup: masterclassKeyboard()
	});
});

bot.callbackQuery("masterclass_signup", async (ctx) => {
	await safeAnswer(ctx);
	const session = await getSession(ctx.from.id);
	session.step = "MASTERCLASS";
	session.masterclass = {};
	await setSession(ctx.from.id, session);
	await logEvent({ userId: ctx.from.id, event: "MASTERCLASS_START" });
	await ctx.editMessageText(
		nextMasterclassQuestion(["full_name"], {}),
		{
			parse_mode: "Markdown",
			reply_markup: new InlineKeyboard().text("❌ Cancel", "masterclass_cancel")
		}
	);
});

bot.callbackQuery("masterclass_cancel", async (ctx) => {
	await safeAnswer(ctx);
	await clearSession(ctx.from.id);
	await ctx.editMessageText(
		"No worries! You can sign up anytime 😊",
		{ reply_markup: mainMenuKeyboard() }
	);
});

// Service detail
bot.callbackQuery(/^service_(.+)$/, async (ctx) => {
	await safeAnswer(ctx);
	const serviceId = ctx.match[1];
	const service = getServiceById(serviceId);
	if (!service) return;

	await logEvent({ userId: ctx.from.id, event: "VIEW_SERVICE", data: serviceId });
	await ctx.editMessageText(formatServiceDetail(service), {
		parse_mode: "Markdown",
		reply_markup: new InlineKeyboard()
			.text(`📅 Book ${service.name}`, `book_${service.id}`)
			.row()
			.text("⬅️ Back to Services", "services")
	});
});

// FAQ topics
bot.callbackQuery(/^faq_(.+)$/, async (ctx) => {
	await safeAnswer(ctx);
	const topic = ctx.match[1];
	const answer = lookupFaq(topic);

	await logEvent({ userId: ctx.from.id, event: "FAQ", data: topic });
	await ctx.editMessageText(answer || "I don't have info on that yet — contact us directly!", {
		parse_mode: "Markdown",
		reply_markup: new InlineKeyboard()
			.text("📷 Book a Session", "book")
			.text("⬅️ Back to FAQs", "faqs")
	});
});

// Booking start
bot.callbackQuery(/^book(_(.+))?$/, async (ctx) => {
	await safeAnswer(ctx);
	const serviceId = ctx.match[2] ?? null;
	const session = await getSession(ctx.from.id);

	if (serviceId) {
		const service = getServiceById(serviceId);
		session.step = "BOOKING";
		session.booking = { service: serviceId };
		await setSession(ctx.from.id, session);
		await logEvent({ userId: ctx.from.id, event: "BOOKING_START", data: serviceId });

		await ctx.editMessageText(
			`📅 *Booking: ${service.name}*\n\nWhat date works for you?\n_(e.g. "20 April" or "next Saturday")_`,
			{ parse_mode: "Markdown", reply_markup: cancelKeyboard() }
		);
	} else {
		session.step = "BOOKING_SELECT_SERVICE";
		await setSession(ctx.from.id, session);

		await ctx.editMessageText(
			`📷 *Book a Session*\n\nWhich service are you interested in?`,
			{ parse_mode: "Markdown", reply_markup: bookServiceKeyboard() }
		);
	}
});

bot.callbackQuery("cancel", async (ctx) => {
	await safeAnswer(ctx);
	await clearSession(ctx.from.id);
	await ctx.editMessageText(
		"No problem — booking cancelled. Anything else I can help with?",
		{ reply_markup: mainMenuKeyboard() }
	);
});

// ── Free text ─────────────────────────────────────────────────────────────────

bot.on("message:text", async (ctx) => {
	const text = ctx.message.text.trim();
	const userId = ctx.from.id;
	const session = await getSession(userId);

	// Active booking flow
	if (session.step === "BOOKING") {
		const parsed = await extractBookingFields({ text });

		if (parsed.cancel) {
			await clearSession(userId);
			await ctx.reply("Booking cancelled. Anything else I can help with?", {
				reply_markup: mainMenuKeyboard()
			});
			return;
		}

		session.booking = mergeDraft(session.booking, parsed);
		const missing = missingBookingFields(session.booking);

		if (missing.length > 0) {
			await setSession(userId, session);
			await ctx.reply(nextBookingQuestion(missing), {
				parse_mode: "Markdown",
				reply_markup: cancelKeyboard()
			});
			return;
		}

		const result = await saveBooking({
			userId,
			username: ctx.from.username,
			booking: session.booking
		});

		await logEvent({ userId, event: "BOOKING_CONFIRMED", data: result.bookingId });
		await clearSession(userId);

		await ctx.reply(formatConfirmation(result), {
			parse_mode: "Markdown",
			reply_markup: mainMenuKeyboard()
		});
		return;
	}

	// Active masterclass signup flow
	if (session.step === "MASTERCLASS") {
		const reg = session.masterclass ?? {};
		const missing = ["full_name", "email", "phone", "experience", "goals"].filter((f) => !reg[f]);

		if (missing.length === 0) {
			// Shouldn't happen, but safety net
			await clearSession(userId);
			await ctx.reply("It looks like you're already registered! Type /start to go back to the menu.");
			return;
		}

		const field = missing[0];
		let value = text.trim();

		// Validate experience field
		if (field === "experience") {
			const parsed = parseExperienceLevel(value);
			if (!parsed) {
				await ctx.reply(
					"Please reply with *1*, *2*, *3*, or *4* to indicate your experience level 🎨",
					{ parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("❌ Cancel", "masterclass_cancel") }
				);
				return;
			}
			value = parsed;
		}

		// Basic email validation
		if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			await ctx.reply(
				"That doesn't look like a valid email address. Please try again 📧",
				{ parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("❌ Cancel", "masterclass_cancel") }
			);
			return;
		}

		session.masterclass = mergeMasterclassDraft(reg, field, value);
		const stillMissing = ["full_name", "email", "phone", "experience", "goals"].filter((f) => !session.masterclass[f]);

		if (stillMissing.length > 0) {
			await setSession(userId, session);
			await ctx.reply(nextMasterclassQuestion(stillMissing, session.masterclass), {
				parse_mode: "Markdown",
				reply_markup: new InlineKeyboard().text("❌ Cancel", "masterclass_cancel")
			});
			return;
		}

		// All fields collected — save
		const result = await saveMasterclassRegistration({
			userId,
			username: ctx.from.username,
			reg: session.masterclass
		});

		await logEvent({ userId, event: "MASTERCLASS_REGISTERED", data: result.regId });
		await clearSession(userId);

		await ctx.reply(formatMasterclassConfirmation(result), {
			parse_mode: "Markdown",
			reply_markup: mainMenuKeyboard()
		});
		return;
	}

	// Classify intent
	const plan = await classifyIntent({ text, history: session.history });
	await logEvent({ userId, event: "INTENT", data: plan.intent });

	session.history = [
		...session.history.slice(-8),
		{ role: "user", content: text }
	];

	switch (plan.intent) {
		case "GREETING":
			await sendWelcome(ctx);
			break;

		case "BOOK":
			session.step = "BOOKING_SELECT_SERVICE";
			await setSession(userId, session);
			await ctx.reply(
				`📷 *Book a Session*\n\nWhich service are you interested in?`,
				{ parse_mode: "Markdown", reply_markup: bookServiceKeyboard() }
			);
			break;

		case "SERVICES":
			await ctx.reply(
				`🎨 *Our Services*\n\nTap a service to learn more:`,
				{ parse_mode: "Markdown", reply_markup: servicesKeyboard() }
			);
			break;

		case "PORTFOLIO":
			await ctx.reply(
				`📸 *Myke Visuals Portfolio*\n\n` +
				`👉 @mykevisuals — https://instagram.com/mykevisuals\n` +
				`👉 @myke\\_studios — https://instagram.com/myke_studios\n\n` +
				`70K+ followers, 500+ posts 🎨`,
				{
					parse_mode: "Markdown",
					reply_markup: new InlineKeyboard().text("📷 Book a Session", "book")
				}
			);
			break;

		case "PRICING":
			await ctx.reply(
				`💰 *Pricing Overview*\n\nTap a service for full details:`,
				{ parse_mode: "Markdown", reply_markup: servicesKeyboard() }
			);
			break;

		case "FAQ": {
			const answer = lookupFaq(plan.faqQuery || text);
			await ctx.reply(
				answer || "I don't have specific info on that — tap below to browse FAQs or contact us directly.",
				{
					parse_mode: "Markdown",
					reply_markup: new InlineKeyboard()
						.text("❓ Browse FAQs", "faqs")
						.text("📞 Contact Us", "contact")
				}
			);
			break;
		}

		case "MASTERCLASS":
			await ctx.reply(masterclassInfo(), {
				parse_mode: "Markdown",
				reply_markup: masterclassKeyboard()
			});
			break;

		case "HANDOFF": {
			const studio = getStudio();
			await ctx.reply(
				`👤 *Speak to Our Team*\n\n` +
				`We'd love to help you directly!\n\n` +
				`📱 Call/WhatsApp: ${studio.phone}\n` +
				`📧 Email: ${studio.email}\n` +
				`📸 DM us: @mykevisuals\n\n` +
				`Our team is available Mon–Sat, 9am–6pm.`,
				{
					parse_mode: "Markdown",
					reply_markup: new InlineKeyboard().text("⬅️ Back to Menu", "menu")
				}
			);
			break;
		}

		default: {
			const reply = plan.reply?.trim() || "I'm here to help! Tap the menu below 👇";
			session.history.push({ role: "assistant", content: reply });
			await setSession(userId, session);
			await ctx.reply(reply, {
				parse_mode: "Markdown",
				reply_markup: mainMenuKeyboard()
			});
		}
	}
});

// ── Error handler ─────────────────────────────────────────────────────────────

bot.catch((err) => {
	if (err.message?.includes("query is too old")) return;
	if (err.message?.includes("query ID is invalid")) return;
	console.error("[bot error]", err.message);
});

// ── Export ────────────────────────────────────────────────────────────────────

export async function handleUpdate(update) {
	await bot.handleUpdate(update);
}
