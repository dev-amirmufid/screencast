import Joi from "joi";
export const getSchema = Joi.object({
  per_page: Joi.number().min(0).allow(null,''),
  page: Joi.number().min(0).allow(null,''),
  order : Joi.array().items(Joi.string().allow(null,'')).allow(null,''),
  keyword: Joi.string().allow(null,''),
  // filter_linkage: Joi.string().allow(null,''),
  no_lti : Joi.boolean().allow(null,'')
});

export const storeSchema = Joi.object({
  name: Joi.string().required(),
  subdomain: Joi.string().required(),
  linkage_type: Joi.string().required().allow('local','oidc','lti'),
  limit: Joi.boolean().required(),
  use_blob_sync: Joi.boolean().required(),
  use_blob_tenant_name: Joi.boolean().required(),
  blob_url : Joi.when('use_blob_sync', {
    switch: [
        { is: true, then: Joi.string().required() },
        { is: false, then: Joi.string().allow(null,'') }
    ]
  }),
  blob_key : Joi.when('use_blob_sync', {
    switch: [
      { is: true, then: Joi.string().required() },
      { is: false, then: Joi.string().allow(null,'') }
    ]
  }),
  blob_tenant_name : Joi.when('use_blob_sync', {
    switch: [
      { is: true, then: Joi.when('use_blob_tenant_name', {
        switch: [
          { is: true, then: Joi.string().required() },
          { is: false, then: Joi.string().allow(null,'') }
        ]
      }) },
      { is: false, then: Joi.string().allow(null,'') }
    ]
  }),
  user_limit : Joi.when('limit', {
    switch: [
        { is: true, then: Joi.number().required() },
        { is: false, then: Joi.number().allow(null,'')},
    ]
  }),
  google_client_id : Joi.when('linkage_type', {
    switch: [
        { is: 'local', then: Joi.string().allow(null,'')},
        { is: 'oidc', then: Joi.when('microsoft_client_id', { 
          is: null || '',
          then: Joi.string().required(),
          otherwise: Joi.string().allow(null,'')
        }) },
        { is: 'lti', then: Joi.string().allow(null,'') }
    ]
  }),
  microsoft_client_id : Joi.when('linkage_type', {
    switch: [
        { is: 'local', then: Joi.string().allow(null,'') },
        { is: 'oidc', then: Joi.when('google_client_id', { 
          is: null || '',
          then: Joi.string().required(),
          otherwise: Joi.string().allow(null,'')
        }) },
        { is: 'lti', then: Joi.string().allow(null,'') }
    ]
  }),
  lti_setting_id: Joi.string().allow(null,''),
  platform_name: Joi.string().allow(null,''),
  platform_url: Joi.string().allow(null,''),
  client_id: Joi.string().allow(null,''),
  authentication_endpoint: Joi.string().allow(null,''),
  accesstoken_endpoint: Joi.string().allow(null,''),
  auth_method_type: Joi.string().allow(null,''),
  auth_key: Joi.string().allow(null,'')
});
