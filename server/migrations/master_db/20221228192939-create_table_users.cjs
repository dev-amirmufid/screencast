'use strict';
const table_name = 'users'

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
      role: {
        type: Sequelize.DataTypes.ENUM('superadmin','admin'),
        allowNull: false
      },
      name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
      },
      username: {
        type: Sequelize.DataTypes.STRING(50),
        allowNull: false
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
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
