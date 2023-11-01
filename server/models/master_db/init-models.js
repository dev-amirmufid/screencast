import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _SequelizeMeta from  "./sequelizemeta.js";
import _databases from  "./databases.js";
import _lti_settings from  "./lti_settings.js";
import _tenants from  "./tenants.js";
import _users from  "./users.js";
import _sync_log from  "./sync_log.js";

export default function initModels(sequelize) {
  const SequelizeMeta = _SequelizeMeta.init(sequelize, DataTypes);
  const databases = _databases.init(sequelize, DataTypes);
  const lti_settings = _lti_settings.init(sequelize, DataTypes);
  const tenants = _tenants.init(sequelize, DataTypes);
  const users = _users.init(sequelize, DataTypes);
  const sync_log = _sync_log.init(sequelize, DataTypes);


  return {
    SequelizeMeta,
    databases,
    lti_settings,
    tenants,
    users,
    sync_log
  };
}
