import { existsSync } from "fs";
import {
  manifestValidation,
  manifestValidationV12,
  academicSessionsValidation,
  classesValidation,
  coursesValidation,
  enrollmentValidation,
  orgsValidation,
  usersValidation,
  usersValidationV12,
  rolesValidation,
  demographicsValidation,
  userProfilesValidation,
} from "./importValidation.js";
import { readCsv } from "../../../helpers/OneRosterReadCsv.js";
import { manifestFiles } from "../../../constants/constans.js";

const OR_V11 = "1.1";
const OR_V12 = "1.2";
const allowedORVersion = [OR_V11, OR_V12];

const messagesJP = {
  "string.alphanum": "{{#label}} には英数字のみを含める必要があります",
  "string.base": "{{#label}} はstringである必要があります",
  "string.base64": "{{#label}} は有効な Base64 stringである必要があります",
  "string.creditCard": "{{#label}} はクレジット カードである必要があります",
  "string.dataUri": "{{#label}} は有効な dataUri stringである必要があります",
  "string.domain":
    "{{#label}} には有効なドメイン名が含まれている必要があります",
  "string.email": "{{#label}} は有効なメールアドレスである必要があります",
  "string.empty": "{{#label}} を空にすることはできません",
  "string.guid": "{{#label}} は有効な GUID である必要があります",
  "string.hex": "{{#label}} には 16 進文字のみを含める必要があります",
  "string.hexAlign":
    "{{#label}} の 16 進数デコード表現はバイトアラインされている必要があります",
  "string.hostname": "{{#label}} は有効なホスト名である必要があります",
  "string.ip":
    "{{#label}} は、{{#cidr}} CIDR を持つ有効な IP アドレスである必要があります",
  "string.ipVersion":
    "{{#label}} は、{{#cidr}} CIDR を持つ次のバージョン {{#version}} のいずれかの有効な IP アドレスである必要があります",
  "string.isoDate": "{{#label}} は iso 形式である必要があります",
  "string.isoDuration": "{{#label}} は有効な ISO 8601 期間である必要があります",
  "string.length": "{{#label}} の長さは {{#limit}} 文字である必要があります",
  "string.lowercase": "{{#label}} には小文字のみを含める必要があります",
  "string.max": "{{#label}} の長さは {{#limit}} 文字以下である必要があります",
  "string.min":
    "{{#label}} の長さは少なくとも {{#limit}} 文字でなければなりません",
  "string.normalize":
    "{{#label}} は {{#form}} 形式で Unicode 正規化する必要があります",
  "string.token":
    "{{#label}} には英数字とアンダースコア文字のみを含める必要があります",
  "string.pattern.base":
    "値が {:[.]} の {{#label}} は必要なパターンに一致しません: {{#regex}}",
  "string.pattern.name":
    "値が {:[.]} の {{#label}} は {{#name}} パターンと一致しません",
  "string.pattern.invert.base":
    "値が {:[.]} の {{#label}} は反転パターンに一致します: {{#regex}}",
  "string.pattern.invert.name":
    "値が {:[.]} の {{#label}} は、反転した {{#name}} パターンに一致します",
  "string.trim": "{{#label}} の先頭または末尾に空白を含めることはできません",
  "string.uri": "{{#label}} は有効な URI である必要があります",
  "string.uriCustomScheme":
    "{{#label}} は、{{#scheme}} パターンに一致するスキームを持つ有効な URI でなければなりません",
  "string.uriRelativeOnly": "{{#label}} は有効な相対 URI である必要があります",
  "string.uppercase": "{{#label}} には大文字のみを含める必要があります",
};

const validateOptions = {
  errors: {
    language: "jp",
  },
  messages: {
    jp: { ...messagesJP },
  },
};

export const checkManifest = async (pathFile) => {
  let errors = [];
  let data = {};
  if (!existsSync(pathFile)) {
    errors.push("manifest.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true },
      (row) => row
    );
    /* refactor object */
    if (dataCsv.length > 0) {
      if (dataCsv[0].propertyName == undefined) {
        errors.push("manifest.csv ヘッダーのプロパティ名が不明です");
        return { errors, data };
      }

      if (dataCsv[0].value == undefined) {
        errors.push("manifest.csv ヘッダー値が不明です");
        return { errors, data };
      }

      let newObjManifest = {};
      dataCsv.forEach((item) => {
        return (newObjManifest[item.propertyName] = item.value);
      });

      if (newObjManifest["oneroster.version"] !== undefined) {
        let schema = false;
        if (newObjManifest["oneroster.version"] == OR_V11) {
          schema = manifestValidation;
        } else if (newObjManifest["oneroster.version"] == OR_V12) {
          schema = manifestValidationV12;
        }

        if (schema) {
          const { error } = schema.validate(newObjManifest, {
            ...validateOptions,
            abortEarly: false,
          });
          if (error?.details) {
            let mapError = error?.details.map(
              (item) => `manifest.csv 項目行の値 : ${item?.message}`
            );
            errors.push(...mapError);
          }

          data = newObjManifest;
        } else {
          errors.push("manifest.csv 項目 oneroster.version が無効です");
        }
      } else {
        errors.push("manifest.csv oneroster.version 列が不明です");
      }
    } else {
      errors.push("manifest.csv 中身は空です");
    }
  }

  return { errors, data };
};

function arrayEquals(a, b) {
  let eq = true;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      eq = false;
      i = a.length;
    }
  }
  return eq;
}

export const checkAcademicSession = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};
  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "academicSessions.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("academicSessions.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "title",
        "type",
        "startDate",
        "endDate",
        "parentSourcedId",
        "schoolYear",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = academicSessionsValidation(type);
        dataCsv.forEach((item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            let mapError;
            if (error?.details) {
              mapError = error?.details.map(
                (item) =>
                  `academicSessions.csv 項目の行番号 ${index + 2} ` +
                  item?.message
              );
              errors.push(...mapError);
            }
            if (item.parentSourcedId && item.parentSourcedId != "NULL") {
              const idxParentSourcedId = dataCsv.findIndex(
                (val) => val.sourcedId === item?.parentSourcedId
              );
              if (idxParentSourcedId < 0) {
                mapError = `academicSessions.csv 項目の行番号 ${
                  index + 2
                } 「parentSourcedId」は、AcademicSessions データの他のレコードに存在しません`;
                errors.push(mapError);
              }
            }
          } catch (error) {
            errors.push(
              `academicSessions.csv 項目の行番号 ${index + 2} 無効です`
            );
          }
        });
      } else {
        errors.push(
          `academicSessions.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkClasses = async (
  pathFile,
  type,
  orVersion,
  coursesData = []
) => {
  let errors = [];
  let data = {};
  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "classes.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("classes.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "title",
        "grades",
        "courseSourcedId",
        "classCode",
        "classType",
        "location",
        "schoolSourcedId",
        "termSourcedIds",
        "subjects",
        "subjectCodes",
        "periods",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      console.log("HV ", headerValid);
      if (headerValid) {
        const schema = classesValidation(type);
        dataCsv.forEach((item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            let mapError;
            if (error?.details) {
              let mapError = error?.details.map(
                (item) =>
                  `classes.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
            // check courseSourcedId
            if (item.courseSourcedId) {
              const idxCoursesId = coursesData.findIndex(
                (val) => val.sourcedId === item?.courseSourcedId
              );
              if (idxCoursesId < 0) {
                mapError = `classes.csv 項目の行番号 ${
                  index + 2
                } 「courseSourcedId」が course.csv のレコードに存在しません`;
                errors.push(mapError);
              }
            }
          } catch (error) {
            errors.push(`classes.csv  項目の行番号 ${index + 2} is invalid`);
          }
        });
      } else {
        errors.push(
          `classes.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkCourses = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};

  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "course.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("courses.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { amir: true, asObject: true },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "schoolYearSourcedId",
        "title",
        "courseCode",
        "grades",
        "orgSourcedId",
        "subjects",
        "subjectCodes",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = coursesValidation(type);
        dataCsv.forEach((item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            if (error?.details) {
              let mapError = error?.details.map(
                (item) =>
                  `courses.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
          } catch (error) {
            errors.push(`courses.csv 項目の行番号 ${index + 2} is invalid`);
          }
        });
      } else {
        errors.push(
          `courses.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkEnrollments = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};

  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "enrollments.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("enrollments.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "classSourcedId",
        "schoolSourcedId",
        "userSourcedId",
        "role",
        "primary",
        "beginDate",
        "endDate",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = enrollmentValidation(type);
        dataCsv.forEach((item, index) => {
          try {
            if (index == 0) {
              console.log(item);
            }
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            if (error?.details) {
              let mapError = error?.details.map(
                (item) =>
                  `enrollments.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
          } catch (error) {
            errors.push(`enrollments.csv 項目の行番号 ${index + 2} is invalid`);
          }
        });
      } else {
        errors.push(
          `enrollments.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkOrgs = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};

  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "orgs.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("orgs.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "name",
        "type",
        "identifier",
        "parentSourcedId",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = orgsValidation(type);
        dataCsv.forEach((item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            let mapError;
            if (error?.details) {
              mapError = error?.details.map(
                (item) => `orgs.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
            // if (item.parentSourcedId) {
            //   const idxParentSourcedId = dataCsv.findIndex(val => val.sourcedId === item?.parentSourcedId);
            //   if (idxParentSourcedId < 0) {
            //     mapError = `orgs.csv 項目の行番号 ${index + 2} "parentSourcedId" not exists in other record of orgs data`;
            //     errors.push(mapError);
            //   }
            // }
          } catch (error) {
            errors.push(`orgs.csv 項目の行番号 ${index + 2} is invalid`);
          }
        });
      } else {
        errors.push(
          `orgs.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkUsers = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};

  if (type == "absent" || !allowedORVersion.includes(orVersion)) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "users.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
  } else if (!existsSync(pathFile)) {
    errors.push("users.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true, objectMode: false },
      (row) => row
    );
    data = dataCsv;
    /* Create schema validation with payload type of export */
    if (type != "absent" && dataCsv.length > 0) {
      let headers = [];
      if (orVersion == OR_V11) {
        headers = [
          "sourcedId",
          "status",
          "dateLastModified",
          "enabledUser",
          "orgSourcedIds",
          "role",
          "username",
          "userIds",
          "givenName",
          "familyName",
          "middleName",
          "identifier",
          "email",
          "sms",
          "phone",
          "agentSourcedIds",
          "grades",
          "password",
        ];
      } else if (orVersion == OR_V12) {
        headers = [
          "sourcedId",
          "status",
          "dateLastModified",
          "enabledUser",
          "username",
          "userIds",
          "givenName",
          "familyName",
          "middleName",
          "identifier",
          "email",
          "sms",
          "phone",
          "agentSourcedIds",
          "grades",
          "password",
          "userMasterIdentifier",
          "preferredGivenName",
          "preferredMiddleName",
          "preferredFamilyName",
          "primaryOrgSourcedId",
          "pronouns",
        ];
        if (
          Object.keys(dataCsv[0]).findIndex(
            (item) => item === "resourceSourcedIds"
          ) >= 0
        ) {
          headers = [
            "sourcedId",
            "status",
            "dateLastModified",
            "enabledUser",
            "username",
            "userIds",
            "givenName",
            "familyName",
            "middleName",
            "identifier",
            "email",
            "sms",
            "phone",
            "agentSourcedIds",
            "grades",
            "password",
            "userMasterIdentifier",
            "resourceSourcedIds",
            "preferredGivenName",
            "preferredMiddleName",
            "preferredFamilyName",
            "primaryOrgSourcedId",
            "pronouns",
          ];
        }
      }

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        let schema = false;

        if (orVersion == OR_V11) {
          schema = usersValidation(type);
        } else if (orVersion == OR_V12) {
          schema = usersValidationV12(type);
        }

        if (schema) {
          dataCsv.forEach(async (item, index) => {
            try {
              const { error } = schema.validate(item, {
                ...validateOptions,
                abortEarly: false,
              });
              let mapError;
              if (error?.details) {
                mapError = error?.details.map(
                  (item) =>
                    `users.csv 項目の行番号 ${index + 2} ` + item?.message
                );
                errors.push(...mapError);
              }

              if (item.agentSourcedIds && item.agentSourcedIds != "NULL") {
                const idxAgentSourcedIds = dataCsv.findIndex(
                  (val) => val.sourcedId === item?.agentSourcedIds
                );
                if (idxAgentSourcedIds < 0) {
                  mapError = `users.csv 項目の行番号 ${
                    index + 2
                  } 「agentSourcedIds」はユーザーデータの他のレコードに存在しません`;
                  errors.push(mapError);
                }
              }
            } catch (error) {
              errors.push(`users.csv 項目の行番号 ${index + 2} is invalid`);
            }
          });
        }
      } else {
        errors.push(
          `users.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkRoles = async (
  pathFile,
  type,
  orVersion,
  userProfilesData = []
) => {
  let errors = [];
  let data = {};

  if (
    !allowedORVersion.includes(orVersion) ||
    orVersion != OR_V12 ||
    type == "absent"
  ) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "role.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
    //do nothing
  } else if (!existsSync(pathFile)) {
    errors.push("roles.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true, objectMode: false },
      (row) => row
    );
    data = dataCsv;

    if (dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "userSourcedId",
        "roleType",
        "role",
        "beginDate",
        "endDate",
        "orgSourcedId",
        "userProfileSourcedId",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = rolesValidation(type);
        dataCsv.forEach(async (item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            let mapError;
            if (error?.details) {
              mapError = error?.details.map(
                (item) => `roles.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }

            // check userProfileId
            if (item.userProfileSourcedId) {
              const idxUserProfile = userProfilesData.findIndex(
                (val) => val.sourcedId === item?.userProfileSourcedId
              );
              if (idxUserProfile < 0) {
                mapError = `roles.csv 項目の行番号 ${
                  index + 2
                } 「userProfileSourcedId」が userProfiles.csv のレコードに存在しません`;
                errors.push(mapError);
              }
            }
          } catch (error) {
            errors.push(`roles.csv 項目の行番号 ${index + 2} is invalid`);
          }
        });
      } else {
        errors.push(
          `roles.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkDemographics = async (pathFile, type, orVersion) => {
  let errors = [];
  let data = {};

  if (
    !allowedORVersion.includes(orVersion) ||
    orVersion != OR_V12 ||
    type == "absent"
  ) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "demographics.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
    //do nothing
  } else if (!existsSync(pathFile)) {
    errors.push("demographics.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true, objectMode: false },
      (row) => row
    );
    data = dataCsv;

    if (dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "birthDate",
        "sex",
        "americanIndianOrAlaskaNative",
        "asian",
        "blackOrAfricanAmerican",
        "nativeHawaiianOrOtherPacificIslander",
        "white",
        "demographicRaceTwoOrMoreRaces",
        "hispanicOrLatinoEthnicity",
        "countryOfBirthCode",
        "stateOfBirthAbbreviation",
        "cityOfBirth",
        "publicSchoolResidenceStatus",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = demographicsValidation(type);
        dataCsv.forEach(async (item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            if (error?.details) {
              let mapError = error?.details.map(
                (item) =>
                  `demographics.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
          } catch (error) {
            errors.push(
              `demographics.csv 項目の行番号 ${index + 2} is invalid`
            );
          }
        });
      } else {
        errors.push(
          `demographics.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkUserProfiles = async (
  pathFile,
  type,
  orVersion,
  usersData = []
) => {
  let errors = [];
  let data = {};

  if (
    !allowedORVersion.includes(orVersion) ||
    orVersion != OR_V12 ||
    type == "absent"
  ) {
    if (type == "absent" && existsSync(pathFile)) {
      errors.push(
        "userProfiles.csv ファイルは存在しますが、manifest.csv 値がありません"
      );
    }
    //do nothing
  } else if (!existsSync(pathFile)) {
    errors.push("userProfiles.csv ファイルが存在しません");
  } else {
    /* read file csv*/
    let dataCsv = await readCsv(
      pathFile,
      { allowQuotes: false, asObject: true, objectMode: false },
      (row) => row
    );
    data = dataCsv;

    if (dataCsv.length > 0) {
      const headers = [
        "sourcedId",
        "status",
        "dateLastModified",
        "userSourcedId",
        "profileType",
        "vendorId",
        "applicationId",
        "description",
        "credentialType",
        "username",
        "password",
      ];

      const headerValid = arrayEquals(headers, Object.keys(dataCsv[0]));
      if (headerValid) {
        const schema = userProfilesValidation(type);
        dataCsv.forEach(async (item, index) => {
          try {
            const { error } = schema.validate(item, {
              ...validateOptions,
              abortEarly: false,
            });
            let mapError;
            if (error?.details) {
              mapError = error?.details.map(
                (item) =>
                  `userProfiles.csv 項目の行番号 ${index + 2} ` + item?.message
              );
              errors.push(...mapError);
            }
            // check userSourcedId
            if (item.userSourcedId) {
              const idxUsersData = usersData.findIndex(
                (val) => val.sourcedId === item?.userSourcedId
              );
              if (idxUsersData < 0) {
                mapError = `userProfiles.csv 項目の行番号 ${
                  index + 2
                } 「userSourcedId」が users.csv のレコードに存在しません`;
                errors.push(mapError);
              }
            }
          } catch (error) {
            errors.push(
              `userProfiles.csv 項目の行番号 ${index + 2} is invalid`
            );
          }
        });
      } else {
        errors.push(
          `userProfiles.csv ヘッダーが無効です。ヘッダーには次のものが含まれている必要があります [${headers.join(
            ", "
          )}] 有効な注文があること`
        );
      }
    }
  }

  return { errors, data };
};

export const checkValidationCSV = async (pathFile) => {
  const { errors: manifestErrors, data: manifestData } = await checkManifest(
    `${pathFile}manifest.csv`
  );
  const { errors: academicSessionErrors, data: academicSessionData } =
    await checkAcademicSession(
      `${pathFile}academicSessions.csv`,
      manifestData?.["file.academicSessions"],
      manifestData?.["oneroster.version"]
    );
  const { errors: coursesErrors, data: coursesData } = await checkCourses(
    `${pathFile}courses.csv`,
    manifestData?.["file.courses"],
    manifestData?.["oneroster.version"]
  );
  const { errors: classesErrors, data: classesData } = await checkClasses(
    `${pathFile}classes.csv`,
    manifestData?.["file.classes"],
    manifestData?.["oneroster.version"],
    coursesData
  );
  const { errors: enrollmentsErrors, data: enrollmentsData } =
    await checkEnrollments(
      `${pathFile}enrollments.csv`,
      manifestData?.["file.enrollments"],
      manifestData?.["oneroster.version"]
    );
  const { errors: orgsErrors, data: orgsData } = await checkOrgs(
    `${pathFile}orgs.csv`,
    manifestData?.["file.orgs"],
    manifestData?.["oneroster.version"]
  );
  const { errors: usersErrors, data: usersData } = await checkUsers(
    `${pathFile}users.csv`,
    manifestData?.["file.users"],
    manifestData?.["oneroster.version"]
  );
  const { errors: demographicsErrors, data: demographicsData } =
    await checkDemographics(
      `${pathFile}demographics.csv`,
      manifestData?.["file.demographics"],
      manifestData?.["oneroster.version"]
    );
  const { errors: userProfilesErrors, data: userProfilesData } =
    await checkUserProfiles(
      `${pathFile}userProfiles.csv`,
      manifestData?.["file.userProfiles"],
      manifestData?.["oneroster.version"],
      usersData
    );
  const { errors: rolesErrors, data: rolesData } = await checkRoles(
    `${pathFile}roles.csv`,
    manifestData?.["file.roles"],
    manifestData?.["oneroster.version"],
    userProfilesData
  );

  let errors = [
    ...manifestErrors,
    ...academicSessionErrors,
    ...classesErrors,
    ...coursesErrors,
    ...enrollmentsErrors,
    ...orgsErrors,
    ...usersErrors,
    ...rolesErrors,
    ...demographicsErrors,
    ...userProfilesErrors,
  ];

  let message = "";
  let error = false;

  if (errors.length > 0) {
    error = true;
    message = "エクスポート エラー。CSV ファイルを再確認してください。: ";
  }

  let manifest = await readCsv(
    `${pathFile}manifest.csv`,
    { headers: true },
    (row) => manifestFiles.includes(row.propertyName) && row.value != "absent"
  );

  let fileExists = [];
  const importedTable = {};

  await Promise.all(
    manifest.map(async (item) => {
      fileExists.push(item.propertyName);
      switch (item.propertyName) {
        case "file.academicSessions":
          if (existsSync(`${pathFile}academicSessions.csv`)) {
            importedTable[`academicSessions`] = 1;
          }

          break;

        case "file.orgs":
          if (existsSync(`${pathFile}orgs.csv`)) {
            importedTable[`orgs`] = 1;
          }

          break;

        case "file.classes":
          if (existsSync(`${pathFile}classes.csv`)) {
            importedTable[`classes`] = 1;
          }

          break;

        case "file.courses":
          if (existsSync(`${pathFile}courses.csv`)) {
            importedTable[`courses`] = 1;
          }

          break;

        case "file.users":
          if (existsSync(`${pathFile}users.csv`)) {
            importedTable[`users`] = 1;
          }
          break;

        case "file.roles":
          if (existsSync(`${pathFile}roles.csv`)) {
            importedTable[`roles`] = 1;
          }
          break;

        case "file.enrollments":
          if (existsSync(`${pathFile}enrollments.csv`)) {
            importedTable[`enrollments`] = 1;
          }
          break;
      }
    })
  );

  if (
    (importedTable[`classes`] && !importedTable[`courses`]) ||
    (!importedTable[`classes`] && importedTable[`courses`]) ||
    (importedTable[`users`] &&
      !importedTable[`roles`] &&
      manifestData?.["oneroster.version"] === "1.2") ||
    (!importedTable[`users`] &&
      importedTable[`roles`] &&
      manifestData?.["oneroster.version"] === "1.2")
  ) {
    let errorPackage;
    if (importedTable[`classes`] && !importedTable[`courses`]) {
      errorPackage = `classes.csv は存在しますが、courses.csv は存在しません`;
    }
    /*TODO_OR sementara di comment dulu validasi ini*/
    /*if (!importedTable[`classes`] && importedTable[`courses`]) {
			errorPackage = `courses.csv is exists, classes.csv does not exist`;
		}*/
    if (
      importedTable[`users`] &&
      !importedTable[`roles`] &&
      manifestData?.["oneroster.version"] === "1.2"
    ) {
      errorPackage = `users.csv は存在しますが、roles.csv は存在しません`;
    }
    /*TODO_OR sementara di comment dulu validasi ini*/
    /*if (
			!importedTable[`users`] &&
			importedTable[`roles`] &&
			manifestData?.["oneroster.version"] === "1.2"
		) {
			errorPackage = `roles.csv is exists, users.csv does not exist`;
		}*/

    if (errorPackage) {
      error = true;
      message = "csvインポートがパッケージと一致しません: " + errorPackage;
    }
  }

  return {
    errors,
    fileExists,
    importedTable,
    message,
    error,
  };
};
