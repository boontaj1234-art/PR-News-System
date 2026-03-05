import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const GS_URL = process.env.GS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycby-DFLkO_IAenG3NStjKA2t0XMm4tTOExgZ1rwBodzqnB6W29EwVT23vktPCSUCyJvX/exec";

app.use(express.json({ limit: "50mb" }));

// API Routes
app.get("/api/config", (req, res) => {
  res.json({ hasGsUrl: !!GS_URL });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const gsResponse = await fetch(`${GS_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    const gsData = await gsResponse.json();
    
    if (gsData.status === "success") {
      res.json(gsData);
    } else {
      res.status(401).json(gsData);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const gsResponse = await fetch(GS_URL);
    const gsData = await gsResponse.json();
    
    const mappedData = gsData.map((item: any, index: number) => ({
      id: index + 1,
      doc_id: item["เลขที่"] || "",
      date: item["วัน/เดือน/ปี"] || "",
      title: item["เรื่อง/กิจกรรม"] || "",
      content: item["เนื้อข่าว"] || "",
      image_url: item["รูป"] || "",
      note: item["หมายเหตุ"] || "",
      created_at: item["วัน/เดือน/ปี"] || ""
    }));

    mappedData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(mappedData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const gsResponse = await fetch(GS_URL, {
      method: "POST",
      body: JSON.stringify({ ...req.body, action: "add" }),
      headers: { "Content-Type": "application/json" }
    });
    const gsData = await gsResponse.json();
    res.json(gsData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/news/doc/:doc_id", async (req, res) => {
  const { doc_id } = req.params;
  try {
    const gsResponse = await fetch(GS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete", doc_id }),
      headers: { "Content-Type": "application/json" }
    });
    const gsData = await gsResponse.json();
    res.json(gsData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/news/:id", async (req, res) => {
  try {
    const gsResponse = await fetch(GS_URL, {
      method: "POST",
      body: JSON.stringify({ ...req.body, action: "edit" }),
      headers: { "Content-Type": "application/json" }
    });
    const gsData = await gsResponse.json();
    res.json(gsData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default app;
