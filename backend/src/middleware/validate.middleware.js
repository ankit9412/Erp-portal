const { StatusCodes } = require('http-status-codes');
const { z } = require('zod');

/**
 * Validate request using Zod schema.
 * Usage: validate(schema) or validate({ body: schema, params: schema, query: schema })
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // If schema has body/params/query keys, validate each separately
      if (schema.body || schema.params || schema.query) {
        const errors = [];

        if (schema.body) {
          const result = schema.body.safeParse(req.body);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              location: 'body',
            })));
          } else {
            req.body = result.data;
          }
        }

        if (schema.params) {
          const result = schema.params.safeParse(req.params);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              location: 'params',
            })));
          } else {
            req.params = result.data;
          }
        }

        if (schema.query) {
          const result = schema.query.safeParse(req.query);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              location: 'query',
            })));
          } else {
            req.query = result.data;
          }
        }

        if (errors.length > 0) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Validation failed',
            errors,
          });
        }
      } else {
        // Validate body directly
        const result = schema.safeParse(req.body);
        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }));
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Validation failed',
            errors,
          });
        }
        req.body = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Common Zod schemas
 */
const schemas = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  pagination: z.object({
    page: z.string().optional().transform((v) => parseInt(v) || 1),
    limit: z.string().optional().transform((v) => Math.min(parseInt(v) || 10, 100)),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
  }),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};

module.exports = { validate, schemas };
