import fetch from "node-fetch";

type SendToN8nPayload = {
  telegramId: string;
  fileUrl: string;
};

export async function sendToN8n(data: SendToN8nPayload) {
  console.log("SEND TO N8N URL:", process.env.N8N_WEBHOOK);
  console.log("SEND TO N8N DATA:", data);

  const response = await fetch(process.env.N8N_WEBHOOK as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const text = await response.text();

  console.log("N8N STATUS:", response.status);
  console.log("N8N RESPONSE:", text);

  if (!response.ok) {
    throw new Error(`n8n error: ${response.status} ${text}`);
  }

  return text;
}