import type { Express } from "express";
import type { Server } from "http";
import { storage, type MovementFilters } from "./storage";
import { z } from "zod";
import { insertSkuSchema, insertMovementSchema, insertAppointmentSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post("/api/appointments", async (req, res) => {
    try {
      const input = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(input);
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Error creating appointment:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/skus", async (_req, res) => {
    try {
      const skuList = await storage.getSkus();
      res.json(skuList);
    } catch (err) {
      console.error("Error fetching SKUs:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/skus", async (req, res) => {
    try {
      const input = insertSkuSchema.parse(req.body);
      const sku = await storage.createSku(input);
      res.status(201).json(sku);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Error creating SKU:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/skus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const input = insertSkuSchema.partial().parse(req.body);
      const sku = await storage.updateSku(id, input);
      if (!sku) return res.status(404).json({ message: "SKU not found" });
      res.json(sku);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Error updating SKU:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/skus/new", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const newSkus = await storage.getNewSkus(from, to);
      res.json(newSkus);
    } catch (err) {
      console.error("Error fetching new SKUs:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements", async (req, res) => {
    try {
      const filters: MovementFilters = {};
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.skuId) filters.skuId = parseInt(req.query.skuId as string);
      if (req.query.from) filters.from = new Date(req.query.from as string);
      if (req.query.to) filters.to = new Date(req.query.to as string);
      if (req.query.kind) filters.kind = req.query.kind as string;
      if (req.query.skuType) filters.skuType = req.query.skuType as string;
      if (req.query.platform) filters.platform = req.query.platform as string;
      const movements = await storage.getMovements(filters);
      res.json(movements);
    } catch (err) {
      console.error("Error fetching movements:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/movements", async (req, res) => {
    try {
      const input = insertMovementSchema.parse(req.body);
      if (input.type === "transfer") {
        return res.status(400).json({ message: "Transfer movements are not yet supported" });
      }
      const movement = await storage.createMovement(input);
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      if (err instanceof Error && err.message === "SKU not found") return res.status(404).json({ message: err.message });
      if (err instanceof Error && err.message.startsWith("Insufficient stock")) return res.status(400).json({ message: err.message });
      console.error("Error creating movement:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/aggregates", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const agg = await storage.getMovementAggregates(from, to);
      res.json(agg);
    } catch (err) {
      console.error("Error fetching aggregates:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/aggregates/by-sku", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const agg = await storage.getMovementAggregatesBySku(from, to);
      res.json(agg);
    } catch (err) {
      console.error("Error fetching aggregates by SKU:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/aggregates/by-category", async (req, res) => {
    try {
      const groupBy = (req.query.groupBy as string) || "kind";
      if (!["kind", "type", "platform"].includes(groupBy)) {
        return res.status(400).json({ message: "groupBy must be kind, type, or platform" });
      }
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const agg = await storage.getMovementAggregatesByCategory(groupBy as "kind" | "type" | "platform", from, to);
      res.json(agg);
    } catch (err) {
      console.error("Error fetching aggregates by category:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/matrix", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const matrix = await storage.getMovementMatrix(from, to);
      res.json(matrix);
    } catch (err) {
      console.error("Error fetching movement matrix:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/kpis", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const kpis = await storage.getKpis(from, to);
      res.json(kpis);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/turnover", async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const turnover = await storage.getTurnoverAnalytics(from, to);
      res.json(turnover);
    } catch (err) {
      console.error("Error fetching turnover:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/turnover/by-category", async (req, res) => {
    try {
      const groupBy = (req.query.groupBy as string) || "kind";
      if (!["kind", "type", "platform"].includes(groupBy)) {
        return res.status(400).json({ message: "groupBy must be kind, type, or platform" });
      }
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const turnover = await storage.getCategoryTurnover(groupBy as "kind" | "type" | "platform", from, to);
      res.json(turnover);
    } catch (err) {
      console.error("Error fetching category turnover:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/snapshots", async (req, res) => {
    try {
      const periodType = req.query.periodType as string | undefined;
      const snapshots = await storage.getAnalyticsSnapshots(periodType);
      res.json(snapshots);
    } catch (err) {
      console.error("Error fetching snapshots:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/sku-analytics", async (_req, res) => {
    try {
      const analytics = await storage.getSkuAnalytics();
      res.json(analytics);
    } catch (err) {
      console.error("Error fetching SKU analytics:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/categories", async (req, res) => {
    try {
      const groupBy = (req.query.groupBy as string) || "kind";
      if (!["kind", "type", "platform"].includes(groupBy)) {
        return res.status(400).json({ message: "groupBy must be kind, type, or platform" });
      }
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const categories = await storage.getCategoryAggregates(groupBy as "kind" | "type" | "platform", from, to);
      res.json(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/analytics/abc-xyz", async (_req, res) => {
    try {
      const analysis = await storage.getAbcXyzAnalysis();
      res.json(analysis);
    } catch (err) {
      console.error("Error fetching ABC-XYZ analysis:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
