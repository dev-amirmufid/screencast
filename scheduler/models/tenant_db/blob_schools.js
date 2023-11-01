import _sequelize from "sequelize";
const { Model, Sequelize } = _sequelize;

export default class blob_schools extends Model {
  static init(sequelize, DataTypes) {
    return sequelize.define(
      "blob_schools",
      {
        id: {
          type: DataTypes.CHAR(36),
          allowNull: false,
          primaryKey: true,
        },
        sourcedId: {
          type: DataTypes.CHAR(36),
          allowNull: true,
        },
        tenant_id: {
          type: DataTypes.CHAR(36),
          allowNull: false,
        },
        school_code: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: "schools_school_code",
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        action: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        is_delta: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },
      {
        tableName: "blob_schools",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "schools_school_code",
            unique: true,
            using: "BTREE",
            fields: [{ name: "school_code" }],
          },
          {
            name: "schools_sourced_id",
            using: "BTREE",
            fields: [{ name: "sourcedId" }],
          },
          {
            name: "schools_tenant_id",
            using: "BTREE",
            fields: [{ name: "tenant_id" }],
          },
        ],
      }
    );
  }
}
