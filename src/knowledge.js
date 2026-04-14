import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let _kb = null;

export function getKnowledge() {
	if (_kb) return _kb;
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const raw = fs.readFileSync(path.join(__dirname, "..", "data", "knowledge.json"), "utf-8");
	_kb = JSON.parse(raw);
	return _kb;
}

export function lookupFaq(question) {
	const kb = getKnowledge();
	const q = (question || "").toLowerCase();
	const hit = kb.faqs.find((f) => f.patterns.some((p) => q.includes(p)));
	return hit?.answer ?? null;
}

export function getServices() {
	return getKnowledge().services;
}

export function getStudio() {
	return getKnowledge().studio;
}

export function getServiceById(id) {
	return getKnowledge().services.find((s) => s.id === id) ?? null;
}

export function formatServiceList() {
	const services = getServices();
	return services
		.map((s, i) => `${i + 1}. *${s.name}* — from ₦${s.price_from.toLocaleString()}`)
		.join("\n");
}

export function formatServiceDetail(service) {
	return (
		`📷 *${service.name}*\n\n` +
		`${service.description}\n\n` +
		`⏱ Duration: ${service.duration}\n` +
		`💰 Starting from: ₦${service.price_from.toLocaleString()}\n` +
		`📦 Deliverables: ${service.deliverables}`
	);
}
