'use strict';
const table_name = 'tenants'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable(table_name,{
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      sourcedId : {
        type : Sequelize.DataTypes.UUID,
        allowNull: true
      },
      name : {
        type : Sequelize.DataTypes.STRING,
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
    })
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  }
};
