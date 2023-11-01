import Joi from "joi";
export const getSchema = Joi.object({
  per_page: Joi.number().min(0).allow(null,''),
  page: Joi.number().min(0).allow(null,''),
  order : Joi.array().items(Joi.string().allow(null,'')).allow(null,''),
  keyword: Joi.string().allow(null,''),
  // status_room: Joi.number().allow(null,''),
  tenant_id: Joi.string().uuid().allow(null,''),
  school_id: Joi.string().uuid().allow(null,'')
});

export const storeSchema = Joi.object({
  name: Joi.string().required(),
  uri: Joi.string().alphanum(),
  expiredAt: Joi.string().isoDate().allow(null,''),
  is_disabled: Joi.boolean(),
  tenant_id: Joi.string().uuid(),
  school_id: Joi.string().uuid(),
  teacher_id: Joi.string().uuid()
});
