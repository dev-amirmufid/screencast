import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class sync_log extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('sync_log', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    job_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
  }, {
    tableName: 'sync_log',
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
        name: "users_tenant_id",
        using: "BTREE",
        fields: [
          { name: "tenant_id" },
        ]
      },
    ]
  });
  }
}
