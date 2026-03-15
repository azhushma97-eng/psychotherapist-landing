import { db } from "./db";
import {
  skus, inventoryMovements, inventorySnapshots, analyticsSnapshots, appointments,
  type InsertSku, type Sku,
  type InsertMovement, type Movement,
  type InsertInventorySnapshot, type InventorySnapshot,
  type InsertAnalyticsSnapshot, type AnalyticsSnapshot,
  type KpiData, type MovementAggregates, type TurnoverData,
  type SkuAnalyticsItem, type CategoryAggregate, type CategoryTurnover,
  type AbcXyzItem,
  type InsertAppointment, type Appointment,
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc, asc, inArray } from "drizzle-orm";

export interface MovementFilters {
  type?: string;
  skuId?: number;
  from?: Date;
  to?: Date;
  kind?: string;
  skuType?: string;
  platform?: string;
}

export interface IStorage {
  createAppointment(data: InsertAppointment): Promise<Appointment>;

  getSkus(): Promise<Sku[]>;
  createSku(data: InsertSku): Promise<Sku>;
  updateSku(id: number, data: Partial<InsertSku>): Promise<Sku | undefined>;
  getNewSkus(from: Date, to: Date): Promise<Sku[]>;

  getMovements(filters?: MovementFilters): Promise<(Movement & { skuName?: string; skuKind?: string; skuType?: string; skuPlatform?: string })[]>;
  createMovement(data: InsertMovement): Promise<Movement>;
  getMovementAggregates(from?: Date, to?: Date): Promise<MovementAggregates>;
  getMovementAggregatesBySku(from?: Date, to?: Date): Promise<{ skuId: number; skuName: string; totalUsd: number; totalUnits: number; count: number }[]>;
  getMovementAggregatesByCategory(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<{ category: string; totalUsd: number; totalUnits: number; count: number }[]>;
  getMovementMatrix(from?: Date, to?: Date): Promise<{ fromStatus: string; toType: string; count: number; totalUsd: number }[]>;
  getCategoryAggregates(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<CategoryAggregate[]>;
  getCategoryTurnover(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<CategoryTurnover[]>;

  getKpis(from?: Date, to?: Date): Promise<KpiData>;
  getTurnoverAnalytics(from?: Date, to?: Date): Promise<TurnoverData>;
  getSkuAnalytics(): Promise<SkuAnalyticsItem[]>;

  getAnalyticsSnapshots(periodType?: string): Promise<AnalyticsSnapshot[]>;
  createAnalyticsSnapshot(data: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot>;
  createInventorySnapshots(data: InsertInventorySnapshot[]): Promise<void>;
  getInventorySnapshots(periodType: string, date?: string): Promise<InventorySnapshot[]>;
  getAbcXyzAnalysis(): Promise<AbcXyzItem[]>;
}

export class DatabaseStorage implements IStorage {
  async createAppointment(data: InsertAppointment): Promise<Appointment> {
    const [result] = await db.insert(appointments).values(data).returning();
    return result;
  }

  async getSkus(): Promise<Sku[]> {
    return await db.select().from(skus).orderBy(asc(skus.name));
  }

  async createSku(data: InsertSku): Promise<Sku> {
    const [result] = await db.insert(skus).values(data).returning();
    return result;
  }

  async updateSku(id: number, data: Partial<InsertSku>): Promise<Sku | undefined> {
    const results = await db.update(skus).set(data).where(eq(skus.id, id)).returning();
    return results[0];
  }

  async getNewSkus(from: Date, to: Date): Promise<Sku[]> {
    return await db.select().from(skus).where(and(gte(skus.createdAt, from), lte(skus.createdAt, to)));
  }

  async getMovements(filters?: MovementFilters): Promise<(Movement & { skuName?: string; skuKind?: string; skuType?: string; skuPlatform?: string })[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(inventoryMovements.type, filters.type));
    if (filters?.skuId) conditions.push(eq(inventoryMovements.skuId, filters.skuId));
    if (filters?.from) conditions.push(gte(inventoryMovements.createdAt, filters.from));
    if (filters?.to) conditions.push(lte(inventoryMovements.createdAt, filters.to));
    if (filters?.kind) conditions.push(eq(skus.kind, filters.kind));
    if (filters?.skuType) conditions.push(eq(skus.type, filters.skuType));
    if (filters?.platform) conditions.push(eq(skus.platform, filters.platform));

    const rows = await db.select({
      id: inventoryMovements.id,
      type: inventoryMovements.type,
      skuId: inventoryMovements.skuId,
      quantity: inventoryMovements.quantity,
      amountUsd: inventoryMovements.amountUsd,
      createdAt: inventoryMovements.createdAt,
      skuName: skus.name,
      skuKind: skus.kind,
      skuType: skus.type,
      skuPlatform: skus.platform,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(inventoryMovements.createdAt));
    return rows.map(r => ({
      ...r,
      skuName: r.skuName ?? undefined,
      skuKind: r.skuKind ?? undefined,
      skuType: r.skuType ?? undefined,
      skuPlatform: r.skuPlatform ?? undefined,
    }));
  }

  async createMovement(data: InsertMovement): Promise<Movement> {
    return await db.transaction(async (tx) => {
      const [sku] = await tx.select().from(skus).where(eq(skus.id, data.skuId));
      if (!sku) throw new Error("SKU not found");

      if ((data.type === "shipment" || data.type === "writeoff") && sku.currentStock < data.quantity) {
        throw new Error(`Insufficient stock: available ${sku.currentStock}, requested ${data.quantity}`);
      }

      const [result] = await tx.insert(inventoryMovements).values(data).returning();
      if (data.type === "incoming") {
        await tx.update(skus).set({ currentStock: sql`${skus.currentStock} + ${data.quantity}` }).where(eq(skus.id, data.skuId));
      } else if (data.type === "shipment" || data.type === "writeoff") {
        await tx.update(skus).set({ currentStock: sql`${skus.currentStock} - ${data.quantity}` }).where(eq(skus.id, data.skuId));
      }
      return result;
    });
  }

  async getMovementAggregates(from?: Date, to?: Date): Promise<MovementAggregates> {
    const conditions = [];
    if (from) conditions.push(gte(inventoryMovements.createdAt, from));
    if (to) conditions.push(lte(inventoryMovements.createdAt, to));

    const rows = await db.select({
      type: inventoryMovements.type,
      totalUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(inventoryMovements)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(inventoryMovements.type);

    const result: MovementAggregates = {};
    for (const row of rows) {
      result[row.type] = { totalUsd: Number(row.totalUsd), totalUnits: Number(row.totalUnits), count: Number(row.count) };
    }
    return result;
  }

  async getMovementAggregatesBySku(from?: Date, to?: Date): Promise<{ skuId: number; skuName: string; totalUsd: number; totalUnits: number; count: number }[]> {
    const conditions = [];
    if (from) conditions.push(gte(inventoryMovements.createdAt, from));
    if (to) conditions.push(lte(inventoryMovements.createdAt, to));

    const rows = await db.select({
      skuId: inventoryMovements.skuId,
      skuName: skus.name,
      totalUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(inventoryMovements.skuId, skus.name)
    .orderBy(sql`sum(${inventoryMovements.amountUsd}) DESC`);

    return rows.map(r => ({
      skuId: r.skuId,
      skuName: r.skuName || `SKU #${r.skuId}`,
      totalUsd: Number(r.totalUsd),
      totalUnits: Number(r.totalUnits),
      count: Number(r.count),
    }));
  }

  async getMovementAggregatesByCategory(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<{ category: string; totalUsd: number; totalUnits: number; count: number }[]> {
    const column = groupBy === "kind" ? skus.kind : groupBy === "type" ? skus.type : skus.platform;
    const conditions = [];
    if (from) conditions.push(gte(inventoryMovements.createdAt, from));
    if (to) conditions.push(lte(inventoryMovements.createdAt, to));

    const rows = await db.select({
      category: column,
      totalUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(column)
    .orderBy(sql`sum(${inventoryMovements.amountUsd}) DESC`);

    return rows.map(r => ({
      category: r.category || "Не указано",
      totalUsd: Number(r.totalUsd),
      totalUnits: Number(r.totalUnits),
      count: Number(r.count),
    }));
  }

  async getMovementMatrix(from?: Date, to?: Date): Promise<{ fromStatus: string; toType: string; count: number; totalUsd: number }[]> {
    const conditions = [];
    if (from) conditions.push(gte(inventoryMovements.createdAt, from));
    if (to) conditions.push(lte(inventoryMovements.createdAt, to));

    const rows = await db.select({
      fromStatus: skus.status,
      toType: inventoryMovements.type,
      count: sql<number>`count(*)`,
      totalUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(skus.status, inventoryMovements.type);

    return rows.map(r => ({
      fromStatus: r.fromStatus || "unknown",
      toType: r.toType,
      count: Number(r.count),
      totalUsd: Number(r.totalUsd),
    }));
  }

  async getCategoryAggregates(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<CategoryAggregate[]> {
    const allSkus = await db.select().from(skus);
    const grouped = new Map<string, { totalSkus: number; totalValueUsd: number; totalUnits: number; movementCount: number; movementUsd: number }>();

    for (const sku of allSkus) {
      const key = (sku[groupBy] || "Не указано");
      const existing = grouped.get(key) || { totalSkus: 0, totalValueUsd: 0, totalUnits: 0, movementCount: 0, movementUsd: 0 };
      existing.totalSkus += 1;
      existing.totalValueUsd += sku.currentStock * sku.costUsd;
      existing.totalUnits += sku.currentStock;
      grouped.set(key, existing);
    }

    if (from && to) {
      const column = groupBy === "kind" ? skus.kind : groupBy === "type" ? skus.type : skus.platform;
      const movementsByCategory = await db.select({
        category: column,
        count: sql<number>`count(*)`,
        totalUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      })
      .from(inventoryMovements)
      .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
      .where(and(gte(inventoryMovements.createdAt, from), lte(inventoryMovements.createdAt, to)))
      .groupBy(column);

      for (const m of movementsByCategory) {
        const key = (m.category || "Не указано");
        const existing = grouped.get(key);
        if (existing) {
          existing.movementCount = Number(m.count);
          existing.movementUsd = Number(m.totalUsd);
        }
      }
    }

    return Array.from(grouped.entries()).map(([value, data]) => ({
      category: groupBy,
      value,
      totalSkus: data.totalSkus,
      totalValueUsd: data.totalValueUsd,
      totalUnits: data.totalUnits,
    }));
  }

  async getCategoryTurnover(groupBy: "kind" | "type" | "platform", from?: Date, to?: Date): Promise<CategoryTurnover[]> {
    const allSkus = await db.select().from(skus);
    const periodStart = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = to || new Date();
    const periodDays = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const conditions = [gte(inventoryMovements.createdAt, periodStart), lte(inventoryMovements.createdAt, periodEnd)];

    const column = groupBy === "kind" ? skus.kind : groupBy === "type" ? skus.type : skus.platform;

    const shipmentsByCategory = await db.select({
      category: column,
      totalSold: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(and(eq(inventoryMovements.type, "shipment"), ...conditions))
    .groupBy(column);

    const incomingByCategory = await db.select({
      category: column,
      totalQty: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(and(eq(inventoryMovements.type, "incoming"), ...conditions))
    .groupBy(column);

    const shipQtyByCategory = await db.select({
      category: column,
      totalQty: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(and(eq(inventoryMovements.type, "shipment"), ...conditions))
    .groupBy(column);

    const writeoffByCategory = await db.select({
      category: column,
      totalQty: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .leftJoin(skus, eq(inventoryMovements.skuId, skus.id))
    .where(and(eq(inventoryMovements.type, "writeoff"), ...conditions))
    .groupBy(column);

    const soldMap = new Map(shipmentsByCategory.map(s => [s.category || "Не указано", Number(s.totalSold)]));
    const incomingQtyMap = new Map(incomingByCategory.map(s => [s.category || "Не указано", Number(s.totalQty)]));
    const shippedQtyMap = new Map(shipQtyByCategory.map(s => [s.category || "Не указано", Number(s.totalQty)]));
    const writeoffQtyMap = new Map(writeoffByCategory.map(s => [s.category || "Не указано", Number(s.totalQty)]));

    const categoryData = new Map<string, { closingStock: number; closingValueUsd: number; avgCost: number }>();
    for (const sku of allSkus) {
      const key = sku[groupBy] || "Не указано";
      const existing = categoryData.get(key) || { closingStock: 0, closingValueUsd: 0, avgCost: 0 };
      existing.closingStock += sku.currentStock;
      existing.closingValueUsd += sku.currentStock * sku.costUsd;
      categoryData.set(key, existing);
    }

    return Array.from(categoryData.entries()).map(([category, data]) => {
      const incomingQty = incomingQtyMap.get(category) || 0;
      const shippedQty = shippedQtyMap.get(category) || 0;
      const writeoffQty = writeoffQtyMap.get(category) || 0;
      const closingStock = data.closingStock;
      const openingStock = Math.max(0, closingStock - incomingQty + shippedQty + writeoffQty);
      const avgCostPerUnit = closingStock > 0 ? data.closingValueUsd / closingStock : 0;
      const avgBalance = ((openingStock + closingStock) / 2) * avgCostPerUnit;

      const soldUsd = soldMap.get(category) || 0;
      const turnoverRatio = avgBalance > 0 ? soldUsd / avgBalance : 0;
      const turnoverPeriod = turnoverRatio > 0 ? Math.round(periodDays / turnoverRatio) : 999;
      return {
        category,
        avgBalanceUsd: Math.round(avgBalance * 100) / 100,
        soldUsd: Math.round(soldUsd * 100) / 100,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        turnoverPeriod,
      };
    });
  }

  async getKpis(from?: Date, to?: Date): Promise<KpiData> {
    const allSkus = await db.select().from(skus);
    const totalSkus = allSkus.length;

    const statusBreakdown: Record<string, number> = {};
    let totalValueUsd = 0;
    let totalUnits = 0;
    const statusValueBreakdown: Record<string, number> = {};

    for (const sku of allSkus) {
      statusBreakdown[sku.status] = (statusBreakdown[sku.status] || 0) + 1;
      const value = sku.currentStock * sku.costUsd;
      totalValueUsd += value;
      totalUnits += sku.currentStock;
      statusValueBreakdown[sku.status] = (statusValueBreakdown[sku.status] || 0) + value;
    }

    const periodStart = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = to || new Date();

    const newSkus = allSkus.filter(s => s.createdAt && s.createdAt >= periodStart && s.createdAt <= periodEnd);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const thirtyDayConditions = [gte(inventoryMovements.createdAt, thirtyDaysAgo), lte(inventoryMovements.createdAt, now)];

    const recentMovements = await db.select({ skuId: inventoryMovements.skuId })
      .from(inventoryMovements)
      .where(and(...thirtyDayConditions));
    const skuIdsWithMovement = new Set(recentMovements.map(m => m.skuId));

    const recentSales = await db.select({ skuId: inventoryMovements.skuId })
      .from(inventoryMovements)
      .where(and(...thirtyDayConditions, eq(inventoryMovements.type, "shipment")));
    const skuIdsWithSales = new Set(recentSales.map(m => m.skuId));

    const skusWithoutSales = allSkus.filter(s => !skuIdsWithSales.has(s.id));
    const skusWithoutMovement = allSkus.filter(s => !skuIdsWithMovement.has(s.id));

    let illiquidValue = 0;
    for (const sku of skusWithoutSales) {
      illiquidValue += sku.currentStock * sku.costUsd;
    }

    return {
      totalSkus,
      newSkus: newSkus.length,
      statusBreakdown,
      totalValueUsd: Math.round(totalValueUsd * 100) / 100,
      totalUnits,
      statusValueBreakdown,
      skusWithoutSales30: skusWithoutSales.length,
      skusWithoutMovement30: skusWithoutMovement.length,
      illiquidValueUsd: Math.round(illiquidValue * 100) / 100,
      skusWithoutSales30List: skusWithoutSales.map(s => s.id),
      skusWithoutMovement30List: skusWithoutMovement.map(s => s.id),
    };
  }

  async getTurnoverAnalytics(from?: Date, to?: Date): Promise<TurnoverData> {
    const allSkus = await db.select().from(skus);
    const periodStart = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = to || new Date();
    const periodDays = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

    const conditions = [gte(inventoryMovements.createdAt, periodStart), lte(inventoryMovements.createdAt, periodEnd)];

    const shipments = await db.select({
      skuId: inventoryMovements.skuId,
      totalSold: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.type, "shipment"), ...conditions))
    .groupBy(inventoryMovements.skuId);

    const incomingByPeriod = await db.select({
      skuId: inventoryMovements.skuId,
      totalIncoming: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
      totalIncomingUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
    })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.type, "incoming"), ...conditions))
    .groupBy(inventoryMovements.skuId);

    const shipmentByPeriod = await db.select({
      skuId: inventoryMovements.skuId,
      totalShipped: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
      totalShippedUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
    })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.type, "shipment"), ...conditions))
    .groupBy(inventoryMovements.skuId);

    const writeoffByPeriod = await db.select({
      skuId: inventoryMovements.skuId,
      totalWrittenOff: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .where(and(eq(inventoryMovements.type, "writeoff"), ...conditions))
    .groupBy(inventoryMovements.skuId);

    const incomingMap = new Map(incomingByPeriod.map(s => [s.skuId, s]));
    const shipmentMap = new Map(shipments.map(s => [s.skuId, s]));
    const shipQtyMap = new Map(shipmentByPeriod.map(s => [s.skuId, s]));
    const writeoffMap = new Map(writeoffByPeriod.map(s => [s.skuId, s]));

    let totalAvgBalance = 0;
    let totalSold = 0;

    const skuTurnover = allSkus.map(sku => {
      const closingStock = sku.currentStock;
      const incomingQty = Number(incomingMap.get(sku.id)?.totalIncoming || 0);
      const shippedQty = Number(shipQtyMap.get(sku.id)?.totalShipped || 0);
      const writtenOffQty = Number(writeoffMap.get(sku.id)?.totalWrittenOff || 0);
      const openingStock = closingStock - incomingQty + shippedQty + writtenOffQty;
      const avgBalance = ((Math.max(0, openingStock) + closingStock) / 2) * sku.costUsd;

      const sold = Number(shipmentMap.get(sku.id)?.totalSold || 0);
      totalAvgBalance += avgBalance;
      totalSold += sold;

      const turnoverRatio = avgBalance > 0 ? sold / avgBalance : 0;
      const turnoverPeriod = turnoverRatio > 0 ? Math.round(periodDays / turnoverRatio) : 999;

      return {
        skuId: sku.id,
        skuName: sku.name,
        avgBalance: Math.round(avgBalance * 100) / 100,
        soldUsd: Math.round(sold * 100) / 100,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        turnoverPeriod,
      };
    });

    const overallTurnoverRatio = totalAvgBalance > 0 ? totalSold / totalAvgBalance : 0;
    const overallTurnoverPeriod = overallTurnoverRatio > 0 ? Math.round(periodDays / overallTurnoverRatio) : 999;

    return {
      avgBalanceUsd: Math.round(totalAvgBalance * 100) / 100,
      turnoverRatio: Math.round(overallTurnoverRatio * 100) / 100,
      turnoverPeriod: overallTurnoverPeriod,
      skuTurnover,
    };
  }

  async getSkuAnalytics(): Promise<SkuAnalyticsItem[]> {
    const allSkus = await db.select().from(skus);

    const lastMovements = await db.select({
      skuId: inventoryMovements.skuId,
      lastMovement: sql<Date>`max(${inventoryMovements.createdAt})`,
    })
    .from(inventoryMovements)
    .groupBy(inventoryMovements.skuId);

    const lastMovementMap = new Map(lastMovements.map(m => [m.skuId, m.lastMovement]));

    const shipments = await db.select({
      skuId: inventoryMovements.skuId,
      totalSoldUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalSoldUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .where(eq(inventoryMovements.type, "shipment"))
    .groupBy(inventoryMovements.skuId);

    const shipmentMap = new Map(shipments.map(s => [s.skuId, s]));

    return allSkus.map(sku => {
      const lastMove = lastMovementMap.get(sku.id);
      const daysWithoutMovement = lastMove ? Math.floor((Date.now() - new Date(lastMove).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      const avgBalance = sku.currentStock * sku.costUsd;
      const ship = shipmentMap.get(sku.id);
      const soldUsd = Number(ship?.totalSoldUsd || 0);
      const soldUnits = Number(ship?.totalSoldUnits || 0);
      const turnoverRatio = avgBalance > 0 ? soldUsd / avgBalance : 0;

      return {
        ...sku,
        lastMovement: lastMove || null,
        daysWithoutMovement,
        stockValueUsd: Math.round(avgBalance * 100) / 100,
        soldUsd: Math.round(soldUsd * 100) / 100,
        soldUnits,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      };
    });
  }

  async getAnalyticsSnapshots(periodType?: string): Promise<AnalyticsSnapshot[]> {
    if (periodType) {
      return await db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.periodType, periodType)).orderBy(desc(analyticsSnapshots.periodStart));
    }
    return await db.select().from(analyticsSnapshots).orderBy(desc(analyticsSnapshots.periodStart));
  }

  async createAnalyticsSnapshot(data: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const [result] = await db.insert(analyticsSnapshots).values(data).returning();
    return result;
  }

  async createInventorySnapshots(data: InsertInventorySnapshot[]): Promise<void> {
    if (data.length > 0) {
      for (let i = 0; i < data.length; i += 50) {
        await db.insert(inventorySnapshots).values(data.slice(i, i + 50));
      }
    }
  }

  async getInventorySnapshots(periodType: string, date?: string): Promise<InventorySnapshot[]> {
    const conditions = [eq(inventorySnapshots.periodType, periodType)];
    if (date) conditions.push(eq(inventorySnapshots.snapshotDate, date));
    return await db.select().from(inventorySnapshots).where(and(...conditions)).orderBy(desc(inventorySnapshots.snapshotDate));
  }

  async getAbcXyzAnalysis(): Promise<AbcXyzItem[]> {
    const allSkus = await db.select().from(skus);

    const shipments = await db.select({
      skuId: inventoryMovements.skuId,
      totalSoldUsd: sql<number>`COALESCE(sum(${inventoryMovements.amountUsd}), 0)`,
      totalSoldUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .where(eq(inventoryMovements.type, "shipment"))
    .groupBy(inventoryMovements.skuId);
    const shipmentMap = new Map(shipments.map(s => [s.skuId, s]));

    const lastMovements = await db.select({
      skuId: inventoryMovements.skuId,
      lastMovement: sql<Date>`max(${inventoryMovements.createdAt})`,
    })
    .from(inventoryMovements)
    .groupBy(inventoryMovements.skuId);
    const lastMovementMap = new Map(lastMovements.map(m => [m.skuId, m.lastMovement]));

    const now = new Date();
    const weeklyShipments = await db.select({
      skuId: inventoryMovements.skuId,
      week: sql<string>`to_char(${inventoryMovements.createdAt}, 'IYYY-IW')`,
      totalUnits: sql<number>`COALESCE(sum(${inventoryMovements.quantity}), 0)`,
    })
    .from(inventoryMovements)
    .where(and(
      eq(inventoryMovements.type, "shipment"),
      gte(inventoryMovements.createdAt, new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000))
    ))
    .groupBy(inventoryMovements.skuId, sql`to_char(${inventoryMovements.createdAt}, 'IYYY-IW')`);

    const allWeekKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000));
      const dayOfWeek = d.getDay() || 7;
      const isoWeek = Math.floor((dayOfYear + 10 - dayOfWeek) / 7) + 1;
      let isoYear = d.getFullYear();
      if (isoWeek < 1) isoYear--;
      else if (isoWeek > 52 && d.getMonth() === 0) isoYear--;
      allWeekKeys.push(`${isoYear}-${String(Math.max(1, isoWeek)).padStart(2, '0')}`);
    }

    const weeklyMapRaw = new Map<number, Map<string, number>>();
    for (const row of weeklyShipments) {
      if (!weeklyMapRaw.has(row.skuId)) weeklyMapRaw.set(row.skuId, new Map());
      weeklyMapRaw.get(row.skuId)!.set(row.week, Number(row.totalUnits));
    }

    const weeklyMap = new Map<number, number[]>();
    for (const [skuId, weekMap] of weeklyMapRaw) {
      const series = allWeekKeys.map(wk => weekMap.get(wk) || 0);
      weeklyMap.set(skuId, series);
    }

    const totalRevenue = shipments.reduce((sum, s) => sum + Number(s.totalSoldUsd), 0);

    const skuItems = allSkus.map(sku => {
      const ship = shipmentMap.get(sku.id);
      const soldUsd = Number(ship?.totalSoldUsd || 0);
      const soldUnits = Number(ship?.totalSoldUnits || 0);
      const costOfSold = soldUnits * sku.costUsd;
      const marginPct = soldUsd > 0 ? Math.round(((soldUsd - costOfSold) / soldUsd) * 100) : 0;
      const revenueShare = totalRevenue > 0 ? (soldUsd / totalRevenue) * 100 : 0;
      const stockValueUsd = sku.currentStock * sku.costUsd;
      const turnoverRatio = stockValueUsd > 0 ? soldUsd / stockValueUsd : 0;

      const avgDailyDemand = soldUnits / 90;
      const daysOfStock = avgDailyDemand > 0 ? Math.round(sku.currentStock / avgDailyDemand) : 999;

      const lastMove = lastMovementMap.get(sku.id);
      const daysWithoutMovement = lastMove ? Math.floor((Date.now() - new Date(lastMove).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      const weeklyDemand = weeklyMap.get(sku.id) || [];
      while (weeklyDemand.length < 12) weeklyDemand.push(0);

      const mean = weeklyDemand.reduce((s, v) => s + v, 0) / weeklyDemand.length;
      const variance = weeklyDemand.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / weeklyDemand.length;
      const stddev = Math.sqrt(variance);
      const demandCv = mean > 0 ? Math.round((stddev / mean) * 100) / 100 : 999;

      return {
        id: sku.id,
        name: sku.name,
        status: sku.status,
        kind: sku.kind,
        type: sku.type,
        platform: sku.platform,
        costUsd: sku.costUsd,
        currentStock: sku.currentStock,
        stockValueUsd: Math.round(stockValueUsd * 100) / 100,
        soldUsd: Math.round(soldUsd * 100) / 100,
        soldUnits,
        revenueShare: Math.round(revenueShare * 100) / 100,
        marginPct,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        daysOfStock,
        daysWithoutMovement,
        lastMovement: lastMove || null,
        weeklyDemand,
        demandCv,
        abcClass: "C" as const,
        xyzClass: "Z" as const,
        combinedClass: "CZ",
        recommendation: "",
      };
    });

    skuItems.sort((a, b) => b.soldUsd - a.soldUsd);
    let cumPct = 0;
    for (const item of skuItems) {
      cumPct += item.revenueShare;
      if (cumPct <= 80) item.abcClass = "A";
      else if (cumPct <= 95) item.abcClass = "B";
      else item.abcClass = "C";
    }

    for (const item of skuItems) {
      if (item.demandCv <= 0.3) item.xyzClass = "X";
      else if (item.demandCv <= 0.7) item.xyzClass = "Y";
      else item.xyzClass = "Z";

      item.combinedClass = `${item.abcClass}${item.xyzClass}`;

      item.recommendation = this.getRecommendation(item);
    }

    return skuItems;
  }

  private getRecommendation(item: AbcXyzItem): string {
    const { abcClass, xyzClass, daysOfStock, daysWithoutMovement, marginPct, status } = item;

    if (status === "not_selling" && daysWithoutMovement > 60) return "Рассмотреть ликвидацию или распродажу со скидкой";
    if (daysWithoutMovement > 90) return "Критично: нет движений >90 дней — рассмотреть списание";
    if (daysOfStock > 180) return "Избыточный запас: сократить закупки, запустить промо-акцию";

    if (abcClass === "A" && xyzClass === "X") return "Ключевой товар: поддерживать стабильный запас, автозаказ";
    if (abcClass === "A" && xyzClass === "Y") return "Высокая выручка, умеренные колебания — следить за трендом";
    if (abcClass === "A" && xyzClass === "Z") return "Важный, но нестабильный — анализировать причины скачков спроса";
    if (abcClass === "B" && xyzClass === "X") return "Стабильный спрос — оптимизировать маржу и объём закупок";
    if (abcClass === "B" && xyzClass === "Y") return "Средний приоритет — мониторить и корректировать запас";
    if (abcClass === "B" && xyzClass === "Z") return "Нестабильный спрос — сократить запас, заказывать мелкими партиями";
    if (abcClass === "C" && xyzClass === "X") return "Низкая выручка, но стабильно — оценить целесообразность";
    if (abcClass === "C" && xyzClass === "Y") return "Кандидат на вывод: низкая выручка + колебания";
    if (abcClass === "C" && xyzClass === "Z") return "Рекомендуется вывести из ассортимента или минимизировать запас";

    if (marginPct < 5) return "Низкая маржа — пересмотреть ценообразование";
    if (daysOfStock > 90) return "Запас на >90 дней — сократить закупки";

    return "Стандартное управление запасом";
  }
}

export const storage = new DatabaseStorage();
