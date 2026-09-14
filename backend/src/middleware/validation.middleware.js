import { BadRequestError } from "../utils/errors.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.safeParse(dataToValidate);

      if (!parsed.success) {
        const errorMessages = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        throw new BadRequestError(`Validation error: ${errorMessages}`, parsed.error.format());
      }

      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
