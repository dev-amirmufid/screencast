'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('databases',{
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      tenant_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      db_host : {
        type : Sequelize.DataTypes.STRING,
        allowNull: false
      },
      db_port : {
        type : Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      db_user : {
        type : Sequelize.DataTypes.STRING,
        allowNull: false
      },
      db_password : {
        type : Sequelize.DataTypes.STRING,
        allowNull: false
      },
      db_name : {
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
    await queryInterface.addIndex("databases",['tenant_id'],{unique:true})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('databases');
  }
};
