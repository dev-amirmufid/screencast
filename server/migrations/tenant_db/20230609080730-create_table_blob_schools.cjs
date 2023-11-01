'use strict';

const table_name = 'blob_schools'
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
      tenant_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      school_code : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      name : {
        type : Sequelize.DataTypes.STRING,
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
    })
    await queryInterface.addIndex(table_name,['school_code'],{unique:true})
    await queryInterface.addIndex(table_name,['sourcedId'])
    await queryInterface.addIndex(table_name,['tenant_id'])
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  }
};
