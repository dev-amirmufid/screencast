import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class logs extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('logs', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    school_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    content_data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'logs',
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
    ]
  });
  }
}
