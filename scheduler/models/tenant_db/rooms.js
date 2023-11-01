import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class rooms extends Model {
  static init(sequelize, DataTypes) {
  return sequelize.define('rooms', {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    school_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    teacher_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    uri: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "rooms_uri"
    },
    is_disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    expiredAt: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'rooms',
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
        name: "rooms_uri",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "uri" },
        ]
      },
      {
        name: "rooms_teacher_id",
        using: "BTREE",
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "rooms_is_disabled",
        using: "BTREE",
        fields: [
          { name: "is_disabled" },
        ]
      },
      {
        name: "rooms_school_id",
        using: "BTREE",
        fields: [
          { name: "school_id" },
        ]
      },
    ]
  });
  }
}
