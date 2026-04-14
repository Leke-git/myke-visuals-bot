import "dotenv/config";

const token = process.env.BOT_TOKEN;
const url = process.env.WEBHOOK_URL;

if (!token || !url) {
  console.error("Missing BOT_TOKEN or WEBHOOK_URL in .env");
  process.exit(1);
}

const webhookUrl = `${url}/api/index`;
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: webhookUrl })
});

const data = await res.json();
console.log("Webhook set:", data);
