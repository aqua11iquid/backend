import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const router = Router();

type TelegramAuthBody = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

function checkTelegramAuth(data: TelegramAuthBody, botToken: string) {
  const secret = crypto.createHash("sha256").update(botToken).digest();

  const dataCheckArr = Object.entries(data)
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);

  const dataCheckString = dataCheckArr.join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return hmac === data.hash;
}

router.post("/telegram", async (req, res) => {
  try {
    const body = req.body as TelegramAuthBody;

    if (!body?.id || !body?.auth_date || !body?.hash) {
      return res.status(400).json({ error: "Invalid telegram auth payload" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const jwtSecret = process.env.JWT_SECRET;

    if (!botToken || !jwtSecret) {
      return res.status(500).json({ error: "Server env is not configured" });
    }

    const isValid = checkTelegramAuth(body, botToken);

    if (!isValid) {
      return res.status(401).json({ error: "Telegram auth validation failed" });
    }

    const user = await prisma.user.upsert({
      where: {
        telegramId: String(body.id),
      },
      update: {
        telegramUsername: body.username ?? null,
        firstName: body.first_name ?? null,
        lastName: body.last_name ?? null,
        photoUrl: body.photo_url ?? null,
        authDate: Number(body.auth_date),
      },
      create: {
        telegramId: String(body.id),
        telegramUsername: body.username ?? null,
        firstName: body.first_name ?? null,
        lastName: body.last_name ?? null,
        photoUrl: body.photo_url ?? null,
        authDate: Number(body.auth_date),

        username: body.username ?? null,
        email: null,
        password: null,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("TELEGRAM AUTH ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

 export default router;