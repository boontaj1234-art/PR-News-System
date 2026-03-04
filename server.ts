import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GS_URL = process.env.GS_WEBAPP_URL || "https://script.google.com/macros/s/AKfycbwtlZA4QcQ1XoTTXs9Y5RY9448mDbX-v135uiJ6qXA0zyuw0_xOe5Vfa2twahL4ttCh/exec";

export async function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.static(path.join(__dirname, "public")));

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
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const gsResponse = await fetch(GS_URL);
      const gsData = await gsResponse.json();
      
      // Map GS headers to NewsItem interface
      // Headers: ["ที่", "เลขที่", "วัน/เดือน/ปี", "เรื่อง/กิจกรรม", "เนื้อข่าว", "รูป", "หมายเหตุ"]
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
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  return app;
}

// Only start the server if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}` || !process.env.VERCEL) {
  const PORT = 3000;
  createApp().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
