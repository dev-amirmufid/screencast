import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class users extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('users', {
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
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(319),
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'users',
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
        name: "users_username",
        using: "BTREE",
        fields: [
          { name: "username" },
        ]
      },
      {
        name: "users_email",
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "users_role",
        using: "BTREE",
        fields: [
          { name: "role" },
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
