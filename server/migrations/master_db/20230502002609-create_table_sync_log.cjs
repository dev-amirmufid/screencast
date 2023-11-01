'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sync_log',{
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      tenant_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      type : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      status : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      job_id : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      message : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      content : {
        type : Sequelize.DataTypes.TEXT,
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
    })
    await queryInterface.addIndex("sync_log",['tenant_id'])
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('sync_log');
  }
};
