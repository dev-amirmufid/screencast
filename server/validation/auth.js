import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().when('open_id', { is: true, then: Joi.required() }),
  room_id: Joi.string().allow(null,''),
  open_id: Joi.boolean(),
  username: Joi.when('open_id', { is: true, then: Joi.string(), otherwise: Joi.string().required()}),
  password: Joi.when('open_id', { is: true, then: Joi.string(), otherwise: Joi.string().required()}),
});
