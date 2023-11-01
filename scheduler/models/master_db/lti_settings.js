import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class lti_settings extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('lti_settings', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: "lti_settings_tenant_id"
    },
    platform_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    platform_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    client_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    authentication_endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    accesstoken_endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    auth_method_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    auth_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'lti_settings',
    timestamps: false,
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
        name: "lti_settings_tenant_id",
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
