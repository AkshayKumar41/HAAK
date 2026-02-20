import express from "express";

const app = express();
app.use(express.json());

const REGION = "us-chicago-1"; // change to your OCI region
const BASE = `https://inference.generativeai.${REGION}.oci.oraclecloud.com/20231130/actions/v1`;
const KEY = process.env.OCI_GENAI_API_KEY; // sk-...

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "meta.llama-3.3-70b-instruct" } = req.body;

    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(3001, () => console.log("Backend on http://localhost:3001"));