import * as Yup from "yup"
import i18next from 'i18next';

export const RoomSchemaValidation = Yup.object().shape({
  name: Yup.string().trim()
    .required(i18next.t('admin.rooms.validation.name_required'))
    .max(128, i18next.t('validation.maxlength').replace('{value}', 128))
    .test(
      'disallow-emoji',
      i18next.t('validation.emoji_disallowed'),
      (value) => !value || (value && !value.match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g))
    )
    ,
  // expiredAt:Yup.string().trim().required(i18next.t('admin.rooms.validation.expiredAt_required')),
  expiredAt: Yup.string().trim().when('is_disabled', (is_disabled, schema) => {
    if(!is_disabled) {
      return schema.nullable(true).required(i18next.t('admin.rooms.validation.expiredAt_required'))
    } else {
      return schema.nullable(true).default(null)
    }
  }),

  is_disabled: Yup.boolean().default(false),
    
  tenant_id: Yup.string().uuid()
    .required(i18next.t('admin.rooms.validation.tenant_id_required')),

  school_id: Yup.string().uuid()
    .required(i18next.t('admin.rooms.validation.school_id_required')),

  teacher_id: Yup.string().uuid()
    .required(i18next.t('admin.rooms.validation.teacher_id_required')),

})
