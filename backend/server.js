import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));

const PORT = Number(process.env.PORT || 3001);
const REGION = process.env.OCI_REGION || "us-chicago-1";
const BASE = `https://inference.generativeai.${REGION}.oci.oraclecloud.com/20231130/actions/v1`;
const KEY = process.env.OCI_GENAI_API_KEY;
const DEFAULT_MODEL = process.env.OCI_MODEL || "meta.llama-3.3-70b-instruct";

if (!KEY) {
  console.error("Missing OCI_GENAI_API_KEY in backend/.env");
  process.exit(1);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, region: REGION, model: DEFAULT_MODEL });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = DEFAULT_MODEL } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages must be a non-empty array" });
    }

    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({
        error: "Oracle GenAI request failed",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT}`);
});
