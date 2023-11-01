'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('lti_settings',{
      id: {
        type : Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      tenant_id : {
        type : Sequelize.DataTypes.UUID,
        allowNull: false
      },
      platform_name : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      platform_url : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      client_id : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      authentication_endpoint : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      accesstoken_endpoint : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      auth_method_type : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      },
      auth_key : {
        type : Sequelize.DataTypes.STRING,
        allowNull: true
      }
    })
    await queryInterface.addIndex("lti_settings",['tenant_id'],{unique:true})
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('lti_settings');
  }
};
