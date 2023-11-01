'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex("users",['username'])
    await queryInterface.addIndex("users",['email'])
    await queryInterface.addIndex("users",['role'])
    await queryInterface.addIndex("users",['tenant_id'])
    
    await queryInterface.addIndex("tenants",['sourcedId'])

    await queryInterface.addIndex("schools",['sourcedId'])
    await queryInterface.addIndex("schools",['tenant_id'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('users','users_username')
    await queryInterface.removeIndex('users','users_email')
    await queryInterface.removeIndex('users','users_role')
    await queryInterface.removeIndex('users','users_tenant_id')

    await queryInterface.removeIndex('tenants','tenant_sourcedId')

    await queryInterface.removeIndex('schools','schools_sourcedId')
    await queryInterface.removeIndex('schools','schools_tenant_id')
  }
};
