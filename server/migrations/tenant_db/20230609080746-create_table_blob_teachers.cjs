'use strict';
const table_name = 'blob_teachers'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable(table_name, {
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
      },
      sourcedId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false
      },
      school_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false
      },
      first_name: {
        type: Sequelize.DataTypes.STRING(128),
        allowNull: false
      },
      middle_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
      },
      last_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
      },
      username: {
        type: Sequelize.DataTypes.STRING(128),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.DataTypes.STRING(30),
        allowNull: true
      },
      email: {
        type: Sequelize.DataTypes.STRING(319),
        allowNull: false
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      action : {
        type : Sequelize.DataTypes.STRING(20),
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
