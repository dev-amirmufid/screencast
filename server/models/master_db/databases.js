import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class databases extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('databases', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: "databases_tenant_id"
    },
    db_host: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    db_port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    db_user: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    db_password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    db_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'databases',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "databases_tenant_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "tenant_id" },
        ]
      },
    ]
  });
  }
}
