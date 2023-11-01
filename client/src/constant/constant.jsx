import i18next from 'i18next';

export const TENANT_LINKAGE_TYPE_OPTION = [{
  value : 'local',
  label : i18next.t('admin.tenants.label.linkage_type_local'),
  name : i18next.t('admin.tenants.label.linkage_type_local')
},{
  value : 'oidc',
  label : i18next.t('admin.tenants.label.linkage_type_oidc'),
  name : i18next.t('admin.tenants.label.linkage_type_oidc')
},{
  value : 'lti',
  label : i18next.t('admin.tenants.label.linkage_type_lti'),
  name : i18next.t('admin.tenants.label.linkage_type_lti')
}]


export const LINKAGE_NAME_TYPE = [{
  value : 'local',
  label : '手動',
  name : '手動'
},{
  value : 'oidc',
  label : 'OIDC',
  name : 'OIDC'
},{
  value : 'lti',
  label : 'LTI',
  name : 'LTI'
}]

export const TENANT_SYNC_NAME = [
  {
    name: "school",
    lable: i18next.t('admin.tenants.sync.label.schools'),
    total_row: 0,
    progress_row: 0,
  },
  {
    name: "teacher",
    lable: i18next.t('admin.tenants.sync.label.teachers'),
    total_row: 0,
    progress_row: 0,
  }
];

export const POLLING = {
  tenant: 3000
};

export const INITIAL_SCREEN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXwAAAEECAIAAACk9BgxAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAE2SURBVHhe7cEBDQAAAMKg909tDwcEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCpGocQAAGHtynIAAAAAElFTkSuQmCC";
  