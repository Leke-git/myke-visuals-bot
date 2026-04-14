// ── Masterclass: Unleash Your Creativity ─────────────────────────────────────

import { getSupabase } from "./supabase.mjs";

// The form fields — collected in order
export const MASTERCLASS_FIELDS = ["full_name", "email", "phone", "experience", "goals"];

export function missingMasterclassFields(reg) {
	return MASTERCLASS_FIELDS.filter((f) => !reg?.[f]);
}

export function nextMasterclassQuestion(missing, reg) {
	switch (missing[0]) {
		case "full_name":
			return `👤 Let's get you registered!\n\nFirst, what's your *full name*?`;
		case "email":
			return `📧 Great, ${reg.full_name}! What's your *email address*?\n\n_(We'll send your confirmation and course materials here.)_`;
		case "phone":
			return `📱 What's your *WhatsApp number*?\n\n_(We'll use this for course updates and reminders.)_`;
		case "experience":
			return (
				`🎨 What's your *current experience level* with photography/videography?\n\n` +
				`Reply with:\n` +
				`• *1* — Complete beginner\n` +
				`• *2* — Hobbyist (shot some stuff)\n` +
				`• *3* — Intermediate (have gear, learning)\n` +
				`• *4* — Advanced / Semi-pro`
			);
		case "goals":
			return `🎯 Last one! What do you *hope to achieve* from this masterclass? (Tell us in a sentence or two)`;
		default:
			return "Can you share more details?";
	}
}

const EXPERIENCE_LABELS = {
	"1": "Complete Beginner",
	"2": "Hobbyist",
	"3": "Intermediate",
	"4": "Advanced / Semi-pro"
};

export function parseExperienceLevel(text) {
	const t = text.trim();
	if (EXPERIENCE_LABELS[t]) return EXPERIENCE_LABELS[t];
	// Accept word answers too
	if (/beginner/i.test(t)) return "Complete Beginner";
	if (/hobby/i.test(t)) return "Hobbyist";
	if (/inter/i.test(t)) return "Intermediate";
	if (/advanc|semi|pro/i.test(t)) return "Advanced / Semi-pro";
	return null;
}

export function mergeMasterclassDraft(draft, field, value) {
	return { ...draft, [field]: value };
}

export async function saveMasterclassRegistration({ userId, username, reg }) {
	const regId = `MC-${Math.floor(Math.random() * 900000 + 100000)}`;

	try {
		const sb = getSupabase();
		await sb.from("masterclass_registrations").insert({
			reg_id: regId,
			user_id: String(userId),
			username: username ?? null,
			full_name: reg.full_name,
			email: reg.email,
			phone: reg.phone,
			experience: reg.experience,
			goals: reg.goals,
			status: "REGISTERED",
			created_at: new Date().toISOString()
		});
	} catch (err) {
		console.error("[masterclass] failed to save:", err.message);
	}

	return { regId, ...reg };
}

export function formatMasterclassConfirmation({ regId, full_name, email, phone, experience }) {
	return (
		`🎉 *You're registered for Unleash Your Creativity!*\n\n` +
		`Here's a summary of your registration:\n\n` +
		`👤 Name: ${full_name}\n` +
		`📧 Email: ${email}\n` +
		`📱 WhatsApp: ${phone}\n` +
		`🎨 Level: ${experience}\n` +
		`🔖 Ref: ${regId}\n\n` +
		`*What happens next?*\n` +
		`✅ You'll receive a confirmation email shortly\n` +
		`✅ Our team will WhatsApp you with course details\n` +
		`✅ Watch this space for the date announcement!\n\n` +
		`Questions? Reach us at @mykevisuals 📸`
	);
}

export function masterclassInfo() {
	return (
		`🎨 *Unleash Your Creativity Masterclass*\n` +
		`_by Myke Visuals_\n\n` +
		`Whether you're a beginner or looking to level up, this masterclass will teach you how to *see, shoot, and tell stories* through your lens.\n\n` +
		`*What you'll learn:*\n` +
		`📸 Composition & lighting fundamentals\n` +
		`🎨 Building your creative visual style\n` +
		`🛠 Editing workflow (Lightroom / Premiere)\n` +
		`💼 Turning your passion into a brand\n` +
		`🤝 Networking & collaborations\n\n` +
		`*Who is this for?*\n` +
		`Anyone passionate about photography, videography, or content creation — from complete beginners to intermediate creators.\n\n` +
		`📍 Abuja (venue TBC)\n` +
		`🔔 Limited spots available!\n\n` +
		`Ready to sign up? Tap below 👇`
	);
}
