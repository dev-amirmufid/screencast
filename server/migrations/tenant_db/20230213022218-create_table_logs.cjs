'use strict';
const table_name = 'logs'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable(table_name, {
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true
      },
      type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
      },
      name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
      },
      content_data: {
        type: Sequelize.DataTypes.TEXT(),
        allowNull: true
      },
      createdBy: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  }
};
