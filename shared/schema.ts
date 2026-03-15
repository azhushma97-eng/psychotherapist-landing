import { pgTable, text, serial, integer, real, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name"),
  socialNetworks: text("social_networks"),
  email: text("email"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const skuStatuses = ["selling", "not_selling", "considering"] as const;
export const movementTypes = ["incoming", "shipment", "writeoff", "transfer"] as const;
export const periodModes = ["week", "month", "realtime", "custom"] as const;

export const skus = pgTable("skus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("selling"),
  kind: text("kind"),
  type: text("type"),
  platform: text("platform"),
  costUsd: real("cost_usd").notNull().default(0),
  currentStock: integer("current_stock").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  skuId: integer("sku_id").notNull(),
  quantity: integer("quantity").notNull(),
  amountUsd: real("amount_usd").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventorySnapshots = pgTable("inventory_snapshots", {
  id: serial("id").primaryKey(),
  periodType: text("period_type").notNull(),
  skuId: integer("sku_id").notNull(),
  stockQuantity: integer("stock_quantity").notNull(),
  stockValueUsd: real("stock_value_usd").notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: serial("id").primaryKey(),
  periodType: text("period_type").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSkuSchema = createInsertSchema(skus).omit({ id: true, createdAt: true }).extend({
  status: z.enum(skuStatuses).default("selling"),
});

export const insertMovementSchema = createInsertSchema(inventoryMovements).omit({ id: true, createdAt: true }).extend({
  type: z.enum(movementTypes),
});

export const insertInventorySnapshotSchema = createInsertSchema(inventorySnapshots).omit({ id: true, createdAt: true });
export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({ id: true, createdAt: true });

export type InsertSku = z.infer<typeof insertSkuSchema>;
export type Sku = typeof skus.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type Movement = typeof inventoryMovements.$inferSelect;
export type InsertInventorySnapshot = z.infer<typeof insertInventorySnapshotSchema>;
export type InventorySnapshot = typeof inventorySnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type PeriodMode = typeof periodModes[number];

export interface KpiData {
  totalSkus: number;
  newSkus: number;
  statusBreakdown: Record<string, number>;
  totalValueUsd: number;
  totalUnits: number;
  statusValueBreakdown: Record<string, number>;
  skusWithoutSales30: number;
  skusWithoutMovement30: number;
  illiquidValueUsd: number;
  skusWithoutSales30List: number[];
  skusWithoutMovement30List: number[];
}

export interface MovementAggregates {
  [type: string]: { totalUsd: number; totalUnits: number; count: number };
}

export interface TurnoverData {
  avgBalanceUsd: number;
  turnoverRatio: number;
  turnoverPeriod: number;
  skuTurnover: SkuTurnoverItem[];
}

export interface SkuTurnoverItem {
  skuId: number;
  skuName: string;
  avgBalance: number;
  soldUsd: number;
  turnoverRatio: number;
  turnoverPeriod: number;
}

export interface SkuAnalyticsItem extends Sku {
  lastMovement: Date | null;
  daysWithoutMovement: number;
  stockValueUsd: number;
  soldUsd: number;
  soldUnits: number;
  turnoverRatio: number;
}

export interface MovementMatrixEntry {
  fromType: string;
  toType: string;
  count: number;
  totalUsd: number;
}

export interface CategoryAggregate {
  category: string;
  value: string;
  totalSkus: number;
  totalValueUsd: number;
  totalUnits: number;
}

export interface CategoryTurnover {
  category: string;
  avgBalanceUsd: number;
  soldUsd: number;
  turnoverRatio: number;
  turnoverPeriod: number;
}

export interface AbcXyzItem {
  id: number;
  name: string;
  status: string;
  kind: string | null;
  type: string | null;
  platform: string | null;
  costUsd: number;
  currentStock: number;
  stockValueUsd: number;
  soldUsd: number;
  soldUnits: number;
  revenueShare: number;
  abcClass: "A" | "B" | "C";
  xyzClass: "X" | "Y" | "Z";
  combinedClass: string;
  marginPct: number;
  turnoverRatio: number;
  daysOfStock: number;
  daysWithoutMovement: number;
  lastMovement: Date | null;
  weeklyDemand: number[];
  demandCv: number;
  recommendation: string;
}
