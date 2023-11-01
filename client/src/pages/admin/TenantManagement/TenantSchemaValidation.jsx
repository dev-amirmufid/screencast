import * as Yup from "yup";
import i18next from "i18next";

export const TenantSchemaValidation = Yup.object().shape({
  name: Yup.string()
    .trim()
    .max(128, i18next.t("validation.maxlength").replace("{value}", 128))
    .test(
      "disallow-emoji",
      i18next.t("validation.emoji_disallowed"),
      (value) =>
        !value ||
        (value &&
          !value.match(
            /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
          ))
    )
    .required(i18next.t("admin.tenants.validation.name_required")),

  limit: Yup.boolean().default(false),

  linkage_type: Yup.string().required(
    i18next.t("admin.tenants.validation.linkage_type_required")
  ),
  subdomain: Yup.string()
    .trim()
    .required(i18next.t("admin.tenants.validation.subdomain_required"))
    .matches(
      /^([a-zA-Z0-9][a-zA-Z0-9-_]*)*[a-zA-Z0-9]*[a-zA-Z0-9-_.]*[[a-zA-Z0-9]+$/,
      {
        message: i18next.t("admin.tenants.validation.subdomain_invalid"),
      }
    )
    .max(64, i18next.t("validation.maxlength").replace("{value}", 64)),
  blob_tenant_name: Yup.string().when(
    "use_blob_sync",
    (use_blob_sync, schema) => {
      if (use_blob_sync) {
        return schema.when(
          "use_blob_tenant_name",
          (use_blob_tenant_name, schema) => {
            if (!use_blob_tenant_name) {
              return schema
                .trim()
                .max(
                  128,
                  i18next.t("validation.maxlength").replace("{value}", 128)
                )
                .test(
                  "disallow-emoji",
                  i18next.t("validation.emoji_disallowed"),
                  (value) =>
                    !value ||
                    (value &&
                      !value.match(
                        /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
                      ))
                )
                .required(
                  i18next.t(
                    "admin.tenants.validation.blob_tenant_name_required"
                  )
                );
            } else {
              return schema.nullable(true);
            }
          }
        );
      } else {
        return schema.nullable(true);
      }
    }
  ),

  blob_url: Yup.string().when("use_blob_sync", (use_blob_sync, schema) => {
    if (use_blob_sync) {
      return schema
        .trim()
        .url(i18next.t("admin.tenants.validation.blob_url_url"))
        .required(i18next.t("admin.tenants.validation.blob_url_required"));
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  blob_key: Yup.string().when("use_blob_sync", (use_blob_sync, schema) => {
    if (use_blob_sync) {
      return schema
        .trim()
        .required(i18next.t("admin.tenants.validation.blob_key_required"));
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  google_client_id: Yup.string().when(
    "linkage_type",
    (linkage_type, schema) => {
      if (linkage_type === "oidc") {
        return schema.when(
          "microsoft_client_id",
          (microsoft_client_id, schema) => {
            if (!microsoft_client_id) {
              return schema
                .trim()
                .test(
                  "disallow-emoji",
                  i18next.t("validation.emoji_disallowed"),
                  (value) =>
                    !value ||
                    (value &&
                      !value.match(
                        /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
                      ))
                )
                .required(
                  i18next.t(
                    "admin.tenants.validation.google_client_id_required"
                  )
                );
            } else {
              return schema.nullable(true).default(null);
            }
          }
        );
      } else {
        return schema.nullable(true).default(null);
      }
    }
  ),

  microsoft_client_id: Yup.string().when(
    "linkage_type",
    (linkage_type, schema) => {
      if (linkage_type === "oidc") {
        return schema.when(
          "google_client_id",
          (microsoft_client_id, schema) => {
            if (!microsoft_client_id) {
              return schema
                .trim()
                .test(
                  "disallow-emoji",
                  i18next.t("validation.emoji_disallowed"),
                  (value) =>
                    !value ||
                    (value &&
                      !value.match(
                        /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
                      ))
                )
                .required(
                  i18next.t(
                    "admin.tenants.validation.microsoft_client_id_required"
                  )
                );
            } else {
              return schema.nullable(true).default(null);
            }
          }
        );
      } else {
        return schema.nullable(true).default(null);
      }
    }
  ),

  // blob_url: Yup.string().when('linkage_type', (linkage_type, schema) => {
  //   if(['oidc','local'].includes(linkage_type)) {
  //     return schema
  //       .required(i18next.t('admin.tenants.validation.blob_url_required'))
  //       .url(i18next.t('admin.tenants.validation.blob_url_url'))
  //   } else {
  //     return schema.nullable(true).default(null)
  //   }
  // }),

  // blob_key: Yup.string().when('linkage_type', (linkage_type, schema) => {
  //   if(['oidc','local'].includes(linkage_type)) {
  //     return schema
  //       .required(i18next.t('admin.tenants.validation.blob_key_required'))
  //   } else {
  //     return schema.nullable(true).default(null)
  //   }
  // }),

  user_limit: Yup.number().when("limit", (limit, schema) => {
    if (limit) {
      return schema
        .required(i18next.t("admin.tenants.validation.user_limit_required"))
        .min(
          1,
          i18next
            .t("admin.tenants.validation.user_limit_min")
            .replace("%MIN%", 1)
        )
        .max(300000, i18next.t("validation.max").replace("{value}", 300000));
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  lti_setting_id: Yup.string().when("linkage_type", (linkage_type, schema) => {
    if (linkage_type == "lti") {
      return schema
        .nullable(true)
        .default(null)
        .test(
          "disallow-emoji",
          i18next.t("validation.emoji_disallowed"),
          (value) =>
            !value ||
            (value &&
              !value.match(
                /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
              ))
        );
      // .required(i18next.t('admin.tenants.validation.platform_name_required'))
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  platform_name: Yup.string().when("linkage_type", (linkage_type, schema) => {
    if (linkage_type == "lti") {
      return schema
        .nullable(true)
        .default(null)
        .test(
          "disallow-emoji",
          i18next.t("validation.emoji_disallowed"),
          (value) =>
            !value ||
            (value &&
              !value.match(
                /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
              ))
        );
      // .required(i18next.t('admin.tenants.validation.platform_name_required'))
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  platform_url: Yup.string().when("linkage_type", (linkage_type, schema) => {
    if (linkage_type == "lti") {
      return schema
        .url(i18next.t("admin.tenants.validation.platform_url_url"))
        .nullable(true)
        .default(null);
      // .required(i18next.t('admin.tenants.validation.platform_url_required'))
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  client_id: Yup.string().when("linkage_type", (linkage_type, schema) => {
    if (linkage_type == "lti") {
      return (
        schema
          // .required(i18next.t('admin.tenants.validation.client_id_required'))
          .nullable(true)
          .default(null)
          .test(
            "disallow-emoji",
            i18next.t("validation.emoji_disallowed"),
            (value) =>
              !value ||
              (value &&
                !value.match(
                  /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
                ))
          )
      );
    } else {
      return schema.nullable(true).default(null);
    }
  }),

  authentication_endpoint: Yup.string().when(
    "linkage_type",
    (linkage_type, schema) => {
      if (linkage_type == "lti") {
        return schema
          .url(
            i18next.t("admin.tenants.validation.authentication_endpoint_url")
          )
          .nullable(true)
          .default(null);
        // .required(i18next.t('admin.tenants.validation.authentication_endpoint_required'))
      } else {
        return schema.nullable(true).default(null);
      }
    }
  ),

  accesstoken_endpoint: Yup.string().when(
    "linkage_type",
    (linkage_type, schema) => {
      if (linkage_type == "lti") {
        return schema
          .url(i18next.t("admin.tenants.validation.accesstoken_endpoint_url"))
          .nullable(true)
          .default(null);
        // .required(i18next.t('admin.tenants.validation.accesstoken_endpoint_required'))
      } else {
        return schema.nullable(true).default(null);
      }
    }
  ),

  auth_method_type: Yup.string().when(
    "linkage_type",
    (linkage_type, schema) => {
      if (linkage_type == "lti") {
        return schema.nullable(true).default(null);
        // .required(i18next.t('admin.tenants.validation.auth_method_type_required'))
      } else {
        return schema.nullable(true).default(null);
      }
    }
  ),

  auth_key: Yup.string().when("linkage_type", (linkage_type, schema) => {
    if (linkage_type == "lti") {
      return schema
        .nullable(true)
        .default(null)
        .test(
          "disallow-emoji",
          i18next.t("validation.emoji_disallowed"),
          (value) =>
            !value ||
            (value &&
              !value.match(
                /([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
              ))
        );
      // .required(i18next.t('admin.tenants.validation.auth_key_required'))
    } else {
      return schema.nullable(true).default(null);
    }
  }),
});
