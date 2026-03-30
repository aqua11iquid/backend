import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import { prisma } from "../db";
import { convertToSticker } from "../stickers/convertSticker";
import { sendToN8n } from "../stickers/sendToN8n";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

router.post("/upload", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    console.log("1. REQUEST CAME TO /upload");

    const telegramId = req.user?.telegramId;
    const userId = req.user?.userId;

    console.log("2. telegramId:", telegramId);
    console.log("2.1 userId:", userId);

    if (!telegramId || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file required" });
    }

    console.log("3. FILE RECEIVED:", req.file.path);

    const stickerPath = await convertToSticker(req.file.path);
    console.log("4. STICKER CREATED:", stickerPath);

    const fileName = path.basename(stickerPath);
    const fileUrl = `https://lindsy-nonsensationalistic-restrainingly.ngrok-free.dev/uploads/${fileName}`;
    console.log("5. FILE URL:", fileUrl);

    console.log("6. SENDING TO N8N...");
    await sendToN8n({
      telegramId,
      fileUrl,
    });
    console.log("7. SENT TO N8N");

    const sticker = await prisma.sticker.create({
      data: {
        fileUrl,
        userId,
      },
    });

    return res.json({
      success: true,
      message: "Стикер обработан и отправлен в n8n",
      stickerPath,
      fileUrl,
      sticker,
    });
  } catch (error) {
    console.error("STICKER UPLOAD ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/my", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stickers = await prisma.sticker.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(stickers);
  } catch (error) {
    console.error("GET MY STICKERS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch stickers",
    });
  }
});

export default router;