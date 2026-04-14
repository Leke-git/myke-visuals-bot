import { getSupabase } from "./supabase.js";
import { getServiceById } from "./knowledge.js";

export function missingBookingFields(booking) {
	const missing = [];
	if (!booking.service) missing.push("service");
	if (!booking.date) missing.push("date");
	if (!booking.time) missing.push("time");
	if (!booking.name) missing.push("name");
	return missing;
}

export function nextBookingQuestion(missing) {
	switch (missing[0]) {
		case "date":
			return "What date works for you? (e.g. 20 April or next Saturday)";
		case "time":
			return "What time would you like? Our studio runs 9am–6pm, Mon–Sat.";
		case "name":
			return "What name should I put the booking under?";
		default:
			return "Can you share more details?";
	}
}

export function mergeDraft(draft, parsed) {
	const next = { ...draft };
	for (const key of ["date", "time", "name", "notes"]) {
		const v = parsed?.[key];
		if (v !== null && v !== undefined && v !== "") next[key] = v;
	}
	return next;
}

export async function saveBooking({ userId, username, booking }) {
	const bookingId = `MV-${Math.floor(Math.random() * 900000 + 100000)}`;
	const service = getServiceById(booking.service);

	try {
		const sb = getSupabase();
		await sb.from("bookings").insert({
			booking_id: bookingId,
			user_id: String(userId),
			username: username ?? null,
			service: service?.name ?? booking.service,
			date: booking.date,
			time: booking.time,
			name: booking.name,
			notes: booking.notes ?? null,
			status: "PENDING",
			created_at: new Date().toISOString()
		});
	} catch (err) {
		console.error("[booking] failed to save:", err.message);
	}

	return { bookingId, service, ...booking };
}

export function formatConfirmation({ bookingId, service, name, date, time, notes }) {
	const studio = { phone: process.env.STUDIO_PHONE || "0812 603 8443" };
	return (
		`✅ *Booking Request Received!*\n\n` +
		`📷 Service: ${service?.name ?? "Photography Session"}\n` +
		`👤 Name: ${name}\n` +
		`📅 Date: ${date}\n` +
		`🕐 Time: ${time}\n` +
		(notes ? `📝 Notes: ${notes}\n` : "") +
		`🔖 Ref: ${bookingId}\n\n` +
		`Our team will confirm your booking and send payment details within a few hours.\n\n` +
		`📞 ${studio.phone}\n` +
		`📸 @mykevisuals`
	);
}
