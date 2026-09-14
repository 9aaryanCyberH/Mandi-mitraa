import { z } from "zod";

export const legacyCommoditiesQuerySchema = z.object({
  state: z.string({
    required_error: "State parameter is required",
    invalid_type_error: "State must be a string"
  }).min(1, "State parameter is required")
});

export const legacyGetDataBodySchema = z.object({
  state: z.string({
    required_error: "State is required",
    invalid_type_error: "State must be a string"
  }).min(1, "State is required"),
  commodity: z.string({
    required_error: "Commodity is required",
    invalid_type_error: "Commodity must be a string"
  }).min(1, "Commodity is required")
});

export const getMandisQuerySchema = z.object({
  state: z.string().optional(),
  stateId: z.coerce.number().optional(),
  district: z.string().optional(),
  districtId: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50)
});
