import JJoi from "joi";
import JoiDate from "@joi/date";

const Joi = JJoi.extend(JoiDate);

const string = Joi.string();
const number = Joi.number();
const date = Joi.date().format("YYYY-MM-DD").raw();
const year = Joi.date().format("YYYY");

export const manifestValidation = Joi.object({
  "manifest.version": string.valid("1.0").required(),
  "oneroster.version": string.required(),
  "file.academicSessions": string.valid("absent", "bulk", "delta").required(),
  "file.categories": string.valid("absent", "bulk", "delta").required(),
  "file.classes": string.valid("absent", "bulk", "delta").required(),
  "file.classResources": string.valid("absent", "bulk", "delta").required(),
  "file.courses": string.valid("absent", "bulk", "delta").required(),
  "file.courseResources": string.valid("absent", "bulk", "delta").required(),
  "file.demographics": string.valid("absent", "bulk", "delta").required(),
  "file.enrollments": string.valid("absent", "bulk", "delta").required(),
  "file.lineItems": string.valid("absent", "bulk", "delta").required(),
  "file.orgs": string.valid("absent", "bulk", "delta").required(),
  "file.resources": string.valid("absent", "bulk", "delta").required(),
  "file.results": string.valid("absent", "bulk", "delta").required(),
  "file.users": string.valid("absent", "bulk", "delta").required(),
  "source.systemName": string.allow("", null),
  "source.systemCode": string.allow("", null),
  "digitalkoumu.oneroster.version": Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .allow("", null),
});

export const manifestValidationV12 = Joi.object({
  "manifest.version": string.valid("1.0").required(),
  "oneroster.version": string.required(),
  "file.academicSessions": string.valid("absent", "bulk", "delta").required(),
  "file.categories": string.valid("absent", "bulk", "delta").required(),
  "file.classes": string.valid("absent", "bulk", "delta").required(),
  "file.classResources": string.valid("absent", "bulk", "delta").required(),
  "file.courses": string.valid("absent", "bulk", "delta").required(),
  "file.courseResources": string.valid("absent", "bulk", "delta").required(),
  "file.demographics": string.valid("absent", "bulk", "delta").required(),
  "file.enrollments": string.valid("absent", "bulk", "delta").required(),
  "file.lineItemLearningObjectiveIds": string
    .valid("absent", "bulk", "delta")
    .required(),
  "file.lineItems": string.valid("absent", "bulk", "delta").required(),
  "file.lineItemScoreScales": string
    .valid("absent", "bulk", "delta")
    .required(),
  "file.orgs": string.valid("absent", "bulk", "delta").required(),
  "file.resources": string.valid("absent", "bulk", "delta").required(),
  "file.resultLearningObjectiveIds": string
    .valid("absent", "bulk", "delta")
    .required(),
  "file.results": string.valid("absent", "bulk", "delta").required(),
  "file.resultScoreScales": string.valid("absent", "bulk", "delta").required(),
  "file.roles": string.valid("absent", "bulk", "delta").required(),
  "file.scoreScales": string.valid("absent", "bulk", "delta").required(),
  "file.userProfiles": string.valid("absent", "bulk", "delta").required(),
  "file.userResources": string.valid("absent", "bulk", "delta").required(),
  "file.users": string.valid("absent", "bulk", "delta").required(),
  "source.systemName": string.allow("", null),
  "source.systemCode": string.allow("", null),
  "digitalkoumu.oneroster.version": Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .allow("", null),
});

/* enum belum di tentukan val nya */
export const academicSessionsValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    title: string.required(),
    type: string
      .valid("gradingPeriod", "semester", "schoolYear", "term")
      .required(),
    startDate: date.required(),
    endDate: date.required(),
    parentSourcedId: string.allow("", null),
    schoolYear: year.required(),
  });

/* enum belum di tentukan val nya */
export const classesValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    title: string.required(),
    grades: string.allow("", null),
    courseSourcedId: string.required(),
    classCode: string.allow("", null),
    classType: string.valid("homeroom", "scheduled", "ext:special").required(),
    location: string.allow("", null),
    schoolSourcedId: string.required(),
    termSourcedIds: string.required(),
    subjects: string.allow("", null),
    subjectCodes: string.allow("", null),
    periods: string.allow("", null),
    "metadata.jp.specialNeeds": string.allow("", null),
  });

/* enum belum di tentukan val nya */
export const coursesValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    schoolYearSourcedId: string.allow("", null),
    title: string.required(),
    courseCode: string.allow("", null),
    grades: string.allow("", null),
    orgSourcedId: string.required(),
    subjects: string.allow("", null),
    subjectCodes: string.allow("", null),
  });

/* enum belum di tentukan val nya */
export const enrollmentValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    classSourcedId: string.required(),
    schoolSourcedId: string.required(),
    userSourcedId: string.required(),
    role: string
      .valid(
        "administrator",
        "student",
        "teacher",
        "proctor",
        "guardian",
        "districtAdministrator",
        "ext:demonstrator"
      )
      .required(),
    primary: string.valid("true", "false").allow("", null),
    beginDate: date.allow("", null),
    endDate: date.allow("", null),
    "metadata.jp.ShussekiNo": string.allow("", null),
    "metadata.jp.PublicFlg": string.allow("", null),
  });

/* enum belum di tentukan val nya */
export const orgsValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    name: string.max(128).required(),
    type: string
      .valid(
        "department",
        "school",
        "district",
        "local",
        "state",
        "national",
        "ext:technicalCollege"
      )
      .required(),
    identifier: string.allow("", null),
    parentSourcedId: string.allow("", null),
  });

/* enum belum di tentukan val nya */
export const usersValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    enabledUser: string.valid("true", "false").required(),
    orgSourcedIds: string.required(),
    role: string
      .valid(
        "administrator",
        "aide",
        "guardian",
        "parent",
        "relative",
        "student",
        "teacher",
        "proctor",
        "districtAdministrator"
      )
      .required(),
    username: string.required(),
    userIds: string.pattern(/^{.*:.*}+$/, { name: "rule" }).allow("", null),
    givenName: string.max(128).required(),
    familyName: string.max(128).required(),
    middleName: string.max(128).allow("", null),
    identifier: string.allow("", null),
    email: string.allow("", null),
    sms: string.allow("", null),
    phone: string.allow("", null),
    agentSourcedIds: string.allow("", null),
    grades: string.allow("", null),
    password: string.allow("", null),
    "metadata.jp.kanaGivenName": string.allow("", null),
    "metadata.jp.kanaFamilyName": string.allow("", null),
    "metadata.jp.kanaMiddleName": string.allow("", null),
    "metadata.jp.homeClass": string.allow("", null),
  });

export const usersValidationV12 = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    enabledUser: string.valid("true", "false").required(),
    username: string.required(),
    userIds: string.pattern(/^{.*:.*}+$/, { name: "rule" }).allow("", null),
    givenName: string.max(128).required(),
    familyName: string.max(128).required(),
    middleName: string.max(128).allow("", null),
    identifier: string.allow("", null),
    email: string.allow("", null),
    sms: string.allow("", null),
    phone: string.allow("", null),
    agentSourcedIds: string.allow("", null),
    grades: string.allow("", null),
    password: string.allow("", null),
    userMasterIdentifier: string.allow("", null),
    resourceSourcedIds: string.allow("", null),
    preferredGivenName: string.allow("", null),
    preferredMiddleName: string.allow("", null),
    preferredFamilyName: string.allow("", null),
    primaryOrgSourcedId: string.allow("", null),
    pronouns: string.allow("", null),
    "metadata.jp.kanaGivenName": string.allow("", null),
    "metadata.jp.kanaFamilyName": string.allow("", null),
    "metadata.jp.kanaMiddleName": string.allow("", null),
    "metadata.jp.homeClass": string.allow("", null),
  });

export const rolesValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    userSourcedId: string.required(),
    roleType: string.valid("primary", "secondary").required(),
    role: string
      .valid(
        "student",
        "teacher",
        "administrator",
        "guardian",
        "districtAdministrator",
        "relative"
      )
      .required(),
    beginDate: date.allow("", null),
    endDate: date.allow("", null),
    orgSourcedId: string.required(),
    userProfileSourcedId: string.allow("", null),
  });

export const demographicsValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    birthDate: date.allow("", null),
    sex: string.valid("male", "female", "unspecified", "other").allow("", null),
    americanIndianOrAlaskaNative: string.valid("true", "false").allow("", null),
    asian: string.valid("true", "false").allow("", null),
    blackOrAfricanAmerican: string.valid("true", "false").allow("", null),
    nativeHawaiianOrOtherPacificIslander: string
      .valid("true", "false")
      .allow("", null),
    white: string.valid("true", "false").allow("", null),
    demographicRaceTwoOrMoreRaces: string
      .valid("true", "false")
      .allow("", null),
    hispanicOrLatinoEthnicity: string.valid("true", "false").allow("", null),
    countryOfBirthCode: string.allow("", null),
    stateOfBirthAbbreviation: string.allow("", null),
    cityOfBirth: string.allow("", null),
    publicSchoolResidenceStatus: string.allow("", null),
  });

export const userProfilesValidation = (type) =>
  Joi.object({
    sourcedId: string.required(),
    status:
      type === "delta"
        ? string.valid("active", "tobedeleted").required()
        : string.valid("active", "tobedeleted").allow("", null),
    dateLastModified:
      type === "delta"
        ? date.format().iso().required()
        : date.format().iso().allow("", null),
    userSourcedId: string.required(),
    profileType: string.required(),
    vendorId: string.required(),
    applicationId: string.allow("", null),
    description: string.allow("", null),
    credentialType: string.required(),
    username: string.required(),
    password: string.allow("", null),
  });
