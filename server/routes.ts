import type { Express } from "express";
import type { Server } from "http";

export async function registerRoutes(server: Server, app: Express) {
  // All data comes from external Google Apps Script API
  // No backend routes needed - the frontend calls GAS directly
  
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Labyrinth BJJ" });
  });
}
