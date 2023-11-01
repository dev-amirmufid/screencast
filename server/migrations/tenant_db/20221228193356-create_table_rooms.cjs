'use strict';
const table_name = 'rooms'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable(table_name,{
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      tenant_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      teacher_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      name : {
        type : Sequelize.DataTypes.STRING(128),
        allowNull: false
      },
      uri : {
        type : Sequelize.DataTypes.STRING(50),
        allowNull: false
      },
      is_disabled : {
        type : Sequelize.DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    })
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  }
};
