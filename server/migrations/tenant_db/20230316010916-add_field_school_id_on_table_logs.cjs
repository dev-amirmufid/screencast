'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('logs', 'school_id',{
      type: Sequelize.UUID,
      allowNull: false,
      after: 'tenant_id'
    });
    
    await queryInterface.addIndex('logs',['school_id'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('logs', 'school_id');
    await queryInterface.removeIndex('logs','school_id')
  }
};
