import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tenants extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('tenants', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    sourcedId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      unique: "tenants_sourced_id"
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    linkage_type: {
      type: DataTypes.ENUM('local','oidc','lti'),
      allowNull: false
    },
    limit: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    user_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    blob_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    blob_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    blob_tenant_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    use_blob_sync: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    use_blob_tenant_name: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    job_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    google_client_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    microsoft_client_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    subdomain: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'tenants',
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
        name: "tenants_sourced_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "sourcedId" },
        ]
      },
      {
        name: "tenants_linkage_type",
        using: "BTREE",
        fields: [
          { name: "linkage_type" },
        ]
      },
      {
        name: "tenants_limit",
        using: "BTREE",
        fields: [
          { name: "limit" },
        ]
      },
      {
        name: "tenants_subdomain",
        using: "BTREE",
        fields: [
          { name: "subdomain" },
        ]
      },
    ]
  });
  }
}
