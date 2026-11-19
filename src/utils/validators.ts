import Joi from 'joi';
import { isValidObjectId } from 'mongoose';

export const objectId = Joi.string().custom((value: string, helpers) =>
  isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value) ? value : helpers.error('any.invalid'),
).messages({ 'any.invalid': '{{#label}} must be a valid id' });

export const idParam = Joi.object({ id: objectId.required() });

export const phone = Joi.string()
  .trim()
  .pattern(/^\+?[\d\s()-]{7,20}$/)
  .messages({ 'string.pattern.base': 'Phone number is not valid' });

export const timezone = Joi.string()
  .max(64)
  .custom((value: string, helpers) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return value;
    } catch {
      return helpers.error('any.invalid');
    }
  })
  .messages({ 'any.invalid': '{{#label}} must be a valid IANA timezone' });

/** Common list query keys: pagination, free-text search and inclusive date range. */
export const listQueryKeys = (sortFields: string[], defaultSort = 'createdAt') => ({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow(''),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  sortBy: Joi.string()
    .valid(...sortFields)
    .default(defaultSort),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});
