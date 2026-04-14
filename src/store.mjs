import { getSupabase } from "./supabase.mjs";

export async function getSession(userId) {
	const sb = getSupabase();
	const { data } = await sb
		.from("sessions")
		.select("data")
		.eq("user_id", String(userId))
		.single();

	const raw = data?.data;
	const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
	return parsed ?? { step: null, booking: {}, history: [] };
}

export async function setSession(userId, session) {
	const sb = getSupabase();
	await sb.from("sessions").upsert(
		{
			user_id: String(userId),
			data: JSON.parse(JSON.stringify(session)),
			updated_at: new Date().toISOString()
		},
		{ onConflict: "user_id" }
	);
}

export async function clearSession(userId) {
	await setSession(userId, { step: null, booking: {}, history: [] });
}
