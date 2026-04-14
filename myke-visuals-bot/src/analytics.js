import { getSupabase } from "./supabase.js";

export async function logEvent({ userId, event, data = null }) {
	try {
		const sb = getSupabase();
		await sb.from("analytics").insert({
			user_id: String(userId),
			event,
			data,
			created_at: new Date().toISOString()
		});
	} catch (err) {
		console.error("[analytics] failed:", err.message);
	}
}
