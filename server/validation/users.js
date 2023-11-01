import Joi from "joi";
export const getSchema = Joi.object({
  per_page: Joi.number().min(0).allow(null,''),
  page: Joi.number().min(0).allow(null,''),
  order : Joi.array().items(Joi.string().allow(null,'')).allow(null,''),
  keyword: Joi.string().allow(null,''),
  role:Joi.string(),
  tenant_id: Joi.string().uuid().allow(null,''),
  school_id: Joi.string().uuid().allow(null,'')
});
