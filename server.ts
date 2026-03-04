import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GS_WEBAPP_URL_DEFAULT = "https://script.google.com/macros/s/AKfycbwtlZA4QcQ1XoTTXs9Y5RY9448mDbX-v135uiJ6qXA0zyuw0_xOe5Vfa2twahL4ttCh/exec";
const GS_URL = (process.env.GS_WEBAPP_URL && process.env.GS_WEBAPP_URL.trim() !== "") 
  ? process.env.GS_WEBAPP_URL 
  : GS_WEBAPP_URL_DEFAULT;

export async function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.static(path.join(__dirname, "public")));

  const fetchWithTimeout = async (url: string, options: any = {}) => {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  // API Routes
  app.get("/api/debug", (req, res) => {
    res.json({ 
      GS_URL_START: GS_URL ? GS_URL.substring(0, 30) + "..." : "NOT SET",
      IS_DEFAULT: GS_URL === GS_WEBAPP_URL_DEFAULT,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      TIME: new Date().toISOString()
    });
  });

  app.get("/api/config", (req, res) => {
    res.json({ hasGsUrl: !!GS_URL });
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const gsResponse = await fetchWithTimeout(`${GS_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
      const responseText = await gsResponse.text();
      let gsData;
      try {
        gsData = JSON.parse(responseText);
      } catch (e) {
        console.error("Login GS Response is not JSON:", responseText.substring(0, 500));
        return res.status(500).json({ error: "Google Script returned invalid JSON", details: responseText.substring(0, 100) });
      }
      
      if (gsData.status === "success") {
        res.json(gsData);
      } else {
        res.status(401).json(gsData);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/news", async (req, res) => {
    console.log("Fetching news from GS_URL:", GS_URL.substring(0, 30) + "...");
    try {
      const gsResponse = await fetchWithTimeout(GS_URL);
      if (!gsResponse.ok) {
        const errorText = await gsResponse.text().catch(() => "No error text");
        console.error(`GS_URL returned status ${gsResponse.status}: ${errorText.substring(0, 200)}`);
        return res.status(gsResponse.status).json({ 
          error: `Google Script error: ${gsResponse.status}`,
          details: errorText.substring(0, 100)
        });
      }
      
      let gsData;
      const responseText = await gsResponse.text();
      try {
        gsData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error("GS Response is not JSON. Response text:", responseText.substring(0, 500));
        return res.status(500).json({ 
          error: "Google Script returned invalid JSON", 
          details: responseText.substring(0, 100) 
        });
      }

      console.log(`Received ${Array.isArray(gsData) ? gsData.length : 'non-array'} items from GS`);

      if (!Array.isArray(gsData)) {
        console.error("GS Data is not an array:", gsData);
        return res.json([]);
      }
      
      // Map GS headers to NewsItem interface
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

      mappedData.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      });
      
      res.json(mappedData);
    } catch (err: any) {
      console.error("Error fetching news:", err);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message,
        details: "Check Vercel logs for more info"
      });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const gsResponse = await fetchWithTimeout(GS_URL, {
        method: "POST",
        body: JSON.stringify({ ...req.body, action: "add" }),
        headers: { "Content-Type": "application/json" }
      });
      const responseText = await gsResponse.text();
      let gsData;
      try {
        gsData = JSON.parse(responseText);
      } catch (e) {
        console.error("Add News GS Response is not JSON:", responseText.substring(0, 500));
        return res.status(500).json({ error: "Google Script returned invalid JSON", details: responseText.substring(0, 100) });
      }
      res.json(gsData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/news/doc/:doc_id", async (req, res) => {
    const { doc_id } = req.params;
    try {
      const gsResponse = await fetchWithTimeout(GS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "delete", doc_id }),
        headers: { "Content-Type": "application/json" }
      });
      const responseText = await gsResponse.text();
      let gsData;
      try {
        gsData = JSON.parse(responseText);
      } catch (e) {
        console.error("Delete News GS Response is not JSON:", responseText.substring(0, 500));
        return res.status(500).json({ error: "Google Script returned invalid JSON", details: responseText.substring(0, 100) });
      }
      res.json(gsData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/news/:id", async (req, res) => {
    try {
      const gsResponse = await fetchWithTimeout(GS_URL, {
        method: "POST",
        body: JSON.stringify({ ...req.body, action: "edit" }),
        headers: { "Content-Type": "application/json" }
      });
      const responseText = await gsResponse.text();
      let gsData;
      try {
        gsData = JSON.parse(responseText);
      } catch (e) {
        console.error("Edit News GS Response is not JSON:", responseText.substring(0, 500));
        return res.status(500).json({ error: "Google Script returned invalid JSON", details: responseText.substring(0, 100) });
      }
      res.json(gsData);
    } catch (err: any) {
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
