import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import cors from "cors";

import authRouter from "./api/auth";
import stickerRouter from "./api/stickers";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.resolve("frontend")));
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/auth", authRouter);
app.use("/stickers", stickerRouter);

app.get("/", (req, res) => {
  res.sendFile(path.resolve("frontend/index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;