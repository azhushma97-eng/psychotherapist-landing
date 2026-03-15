import { z } from "zod";
import { insertSkuSchema, insertMovementSchema, insertAppointmentSchema, periodModes } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export type CreateAppointmentInput = z.infer<typeof insertAppointmentSchema>;

export const api = {
  appointments: {
    create: {
      method: "POST" as const,
      path: "/api/appointments" as const,
      input: insertAppointmentSchema,
      responses: {
        201: z.object({ id: z.number(), name: z.string().nullable(), socialNetworks: z.string().nullable(), email: z.string().nullable(), message: z.string().nullable() }),
        400: z.object({ message: z.string() }),
      }
    }
  },
  skus: {
    list: { method: "GET" as const, path: "/api/skus" as const },
    create: { method: "POST" as const, path: "/api/skus" as const, input: insertSkuSchema },
    update: { method: "PATCH" as const, path: "/api/skus/:id" as const, input: insertSkuSchema.partial() },
    newInRange: { method: "GET" as const, path: "/api/skus/new" as const },
  },
  movements: {
    list: { method: "GET" as const, path: "/api/movements" as const },
    create: { method: "POST" as const, path: "/api/movements" as const, input: insertMovementSchema },
    aggregates: { method: "GET" as const, path: "/api/movements/aggregates" as const },
    matrix: { method: "GET" as const, path: "/api/movements/matrix" as const },
  },
  analytics: {
    kpis: { method: "GET" as const, path: "/api/analytics/kpis" as const },
    turnover: { method: "GET" as const, path: "/api/analytics/turnover" as const },
    snapshots: { method: "GET" as const, path: "/api/analytics/snapshots" as const },
    skuAnalytics: { method: "GET" as const, path: "/api/analytics/sku-analytics" as const },
    categories: { method: "GET" as const, path: "/api/analytics/categories" as const },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
