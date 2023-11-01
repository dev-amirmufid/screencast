export const SYNC_STEP = [
  "DOWNLOAD_BLOB",
  "EXTRACT_ZIP",
  "CSV_VALIDATION",
  "SCHOOL",
  "TEACHER",
  "EXECUTE_IMPORT",
];
export const manifestFiles = [
  "file.academicSessions",
  "file.categories",
  "file.classes",
  "file.classResources",
  "file.courses",
  "file.courseResources",
  "file.demographics",
  "file.enrollments",
  "file.lineItems",
  "file.orgs",
  "file.resources",
  "file.results",
  "file.users",
  "file.roles",
];
export const SCHOOL_AC_TYPE = {
  P: 1,
  J: 2,
  H: 3,
  U: 3,
};
export const ACTION_UPSERT = "upsert";
export const ACTION_DELETE = "delete";
export const DB_TYPE_MASTER = "master";
export const DB_TYPE_TENANT = "tenant";
export const TABLE_SCHOOL = "schools";
export const TABLE_TEACHER = "teachers";
export const TABLE_ROOM = "rooms";
export const TABLE_USER = "users";
export const TABLE_BLOB_SCHOOL = "blob_schools";
export const TABLE_BLOB_TEACHER = "blob_teachers";
export const MANIFEST_FIELD_OR_VERSION = "oneroster.version";
export const ARR_ACTION_LIST = ["CREATE", "UPDATE", "DELETE"];
