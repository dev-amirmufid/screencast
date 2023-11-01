'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'subdomain',{
      type: Sequelize.STRING,
      allowNull: false,
      after: "microsoft_client_id"
    });

    await queryInterface.addIndex("tenants",['subdomain'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'subdomain');

    await queryInterface.removeIndex("tenants",'subdomain')
  }
};
