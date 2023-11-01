import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _SequelizeMeta from  "./sequelizemeta.js";
import _logs from  "./logs.js";
import _rooms from  "./rooms.js";
import _schools from  "./schools.js";
import _teachers from  "./teachers.js";
import _blob_schools from  "./blob_schools.js";
import _blob_teachers from  "./blob_teachers.js";

export default function initModels(sequelize) {
  const SequelizeMeta = _SequelizeMeta.init(sequelize, DataTypes);
  const logs = _logs.init(sequelize, DataTypes);
  const rooms = _rooms.init(sequelize, DataTypes);
  const schools = _schools.init(sequelize, DataTypes);
  const teachers = _teachers.init(sequelize, DataTypes);
  const blob_schools = _blob_schools.init(sequelize, DataTypes);
  const blob_teachers = _blob_teachers.init(sequelize, DataTypes);


  return {
    SequelizeMeta,
    logs,
    rooms,
    schools,
    teachers,
    blob_schools,
    blob_teachers,
  };
}
