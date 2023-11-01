import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _SequelizeMeta from  "./sequelizemeta.js";
import _logs from  "./logs.js";
import _rooms from  "./rooms.js";
import _schools from  "./schools.js";
import _teachers from  "./teachers.js";

export default function initModels(sequelize) {
  const SequelizeMeta = _SequelizeMeta.init(sequelize, DataTypes);
  const logs = _logs.init(sequelize, DataTypes);
  const rooms = _rooms.init(sequelize, DataTypes);
  const schools = _schools.init(sequelize, DataTypes);
  const teachers = _teachers.init(sequelize, DataTypes);


  return {
    SequelizeMeta,
    logs,
    rooms,
    schools,
    teachers,
  };
}
