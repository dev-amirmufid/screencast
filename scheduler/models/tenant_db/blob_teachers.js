import _sequelize from "sequelize";
const { Model, Sequelize } = _sequelize;

export default class blob_teachers extends Model {
  static init(sequelize, DataTypes) {
    return sequelize.define(
      "blob_teachers",
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
        school_id: {
          type: DataTypes.CHAR(36),
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        middle_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        last_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        username: {
          type: DataTypes.STRING(128),
          allowNull: true,
        },
        phone_number: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(319),
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: true,
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
        tableName: "blob_teachers",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "teachers_sourced_id",
            using: "BTREE",
            fields: [{ name: "sourcedId" }],
          },
          {
            name: "teachers_tenant_id",
            using: "BTREE",
            fields: [{ name: "tenant_id" }],
          },
          {
            name: "teachers_username",
            using: "BTREE",
            fields: [{ name: "username" }],
          },
          {
            name: "teachers_email",
            using: "BTREE",
            fields: [{ name: "email" }],
          },
          {
            name: "teachers_school_id",
            using: "BTREE",
            fields: [{ name: "school_id" }],
          },
        ],
      }
    );
  }
}
