import { z } from "zod";

export const getPricesQuerySchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  mandi: z.string().optional(),
  commodity: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc")
});

export const comparePricesQuerySchema = z.object({
  commodity: z.string().min(1, "Commodity is required"),
  state: z.string().optional(),
  mandi: z.string().optional()
});

export const historyPricesQuerySchema = z.object({
  commodity: z.string().optional(),
  mandi: z.string().optional(),
  state: z.string().optional(),
  days: z.coerce.number().min(1).max(36500).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});

export const analyticsQuerySchema = z.object({
  commodity: z.string().optional(),
  state: z.string().optional(),
  mandi: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  days: z.coerce.number().optional()
});
