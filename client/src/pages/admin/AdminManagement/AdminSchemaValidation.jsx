import * as Yup from "yup"
import i18next from 'i18next';

export const AdminSchemaValidation = Yup.object().shape({
  role: Yup.string()
    .required(i18next.t('admin.validation.role_required')),
  tenant_id: Yup.string()
    .required(i18next.t('admin.validation.tenant_required')),
  school_id: Yup.string().when('role', (role, schema) => {
    if(role === 'school_admin') {
      return schema.trim().nullable(true).required(i18next.t('admin.validation.school_required'))
    } else {
      return schema.trim().nullable(true).default(null)
    }
  }),
  email: Yup.string().trim()
    // .email(i18next.t('admin.validation.invalid_email'))
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, i18next.t('admin.validation.invalid_email'))
    .max(319, i18next.t('validation.maxlength').replace('{value}', 319)),
  name: Yup.string().trim()
    .max(128, i18next.t('validation.maxlength').replace('{value}', 128))
    .test(
      'disallow-emoji',
      i18next.t('validation.emoji_disallowed'),
      (value) => !value || (value && !value.match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g))
    )
    // .matches(/^[a-zA-Z\s\u00A0]+$/, i18next.t('validation.alphabet'))
  ,
  username: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9_.!*’()-]+$/, i18next.t('admin.teachers.validation.invalid_username'))
    .max(128, i18next.t('validation.maxlength').replace('{value}', 128))
    .required(i18next.t('admin.validation.userid_required')),

  password: Yup.string().trim()
    .min(4, i18next.t('validation.minlength').replace('{value}', 4))
    .max(12, i18next.t('validation.maxlength').replace('{value}', 12))
    .test(
      'disallow-emoji',
      i18next.t('validation.emoji_disallowed'),
      (value) => !value || (value && !value.match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g))
    )
    .required(i18next.t('admin.validation.password_required')),
  password_confirm: Yup.string().trim()
    .oneOf([Yup.ref('password'), null], i18next.t('admin.validation.password_match'))
    .required(i18next.t('admin.validation.password_confirm_required')),
})
