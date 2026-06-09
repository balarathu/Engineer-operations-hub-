import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbwUdYjHkM_Saqs7FSwTk5lEGT4UTkGvcYT56T1q1UincEKeT6aMrPEnjU3cIZFJzDcL/exec";
  const CONFIG_FILE_PROJECT = path.join(process.cwd(), "config-db.json");
  const CONFIG_FILE_TMP = path.join("/tmp", "config-db.json");
  const LOG_FILE_TMP = path.join("/tmp", "server-logs.txt");

  function safeAppendLog(msg: string) {
    try {
      fs.appendFileSync(LOG_FILE_TMP, `[${new Date().toISOString()}] ${msg}\n`, "utf-8");
    } catch {
      // Ignore if write triggers fail on restricted sandboxes
    }
  }

  function getSheetUrl(): string {
    // 1. Try /tmp/config-db.json first (dynamic runtime override)
    try {
      if (fs.existsSync(CONFIG_FILE_TMP)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE_TMP, "utf-8"));
        if (data.sheetUrl) return data.sheetUrl;
      }
    } catch {}

    // 2. Try process.cwd()/config-db.json (development file config)
    try {
      if (fs.existsSync(CONFIG_FILE_PROJECT)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE_PROJECT, "utf-8"));
        if (data.sheetUrl) return data.sheetUrl;
      }
    } catch {}

    // 3. Absolute Fallback (user's master sheet url)
    return DEFAULT_SHEET_URL;
  }

  function saveSheetUrl(url: string) {
    try {
      fs.writeFileSync(CONFIG_FILE_TMP, JSON.stringify({ sheetUrl: url || "" }), "utf-8");
    } catch (err: any) {
      console.warn("Could not save config dynamically to /tmp/config-db.json:", err.message);
    }
  }

  // API/config routes
  app.get("/api/config", (req, res) => {
    const url = getSheetUrl();
    return res.json({ success: true, sheetUrl: url });
  });

  app.post("/api/config", (req, res) => {
    const { sheetUrl } = req.body;
    saveSheetUrl(sheetUrl);
    return res.json({ success: true, sheetUrl: sheetUrl || getSheetUrl() });
  });

  // Proxy GET request to Google Sheet
  app.get("/api/proxy-sheet", async (req, res) => {
    try {
      safeAppendLog("GET /api/proxy-sheet called");
      const url = getSheetUrl();
      
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      safeAppendLog(`GET fetching Google Sheet: ${fetchUrl}`);
      
      const response = await fetch(fetchUrl);
      safeAppendLog(`GET Google Response status: ${response.status}`);
      
      const resText = await response.text();
      safeAppendLog(`GET Google Response body length: ${resText.length}`);
      
      try {
        const resJson = JSON.parse(resText);
        return res.json(resJson);
      } catch (parseError) {
        safeAppendLog(`GET Parser failed. Snippet: ${resText.substring(0, 200)}`);
        return res.status(502).json({ 
          success: false, 
          error: "Received non-JSON response from Google Sheet. Verify that the URL is a deployed Google Apps Script Web App.",
          raw: resText 
        });
      }
    } catch (error: any) {
      console.error("Proxy GET failed:", error);
      safeAppendLog(`GET exception: ${error.message || String(error)}`);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Proxy POST request to Google Sheet
  app.post("/api/proxy-sheet", async (req, res) => {
    try {
      safeAppendLog("POST /api/proxy-sheet called");
      const url = getSheetUrl();
      
      safeAppendLog(`POST fetching Google Sheet: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(req.body)
      });
      safeAppendLog(`POST Google Response status: ${response.status}`);
      
      const resText = await response.text();
      safeAppendLog(`POST Google Response body length: ${resText.length}`);
      
      try {
        const resJson = JSON.parse(resText);
        return res.json(resJson);
      } catch (parseError) {
        safeAppendLog(`POST Parser failed. Snippet: ${resText.substring(0, 200)}`);
        return res.status(502).json({ 
          success: false, 
          error: "Received non-JSON response from Google Sheet. Verify that the URL is a deployed Google Apps Script Web App.",
          raw: resText 
        });
      }
    } catch (error: any) {
      console.error("Proxy POST failed:", error);
      safeAppendLog(`POST exception: ${error.message || String(error)}`);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
