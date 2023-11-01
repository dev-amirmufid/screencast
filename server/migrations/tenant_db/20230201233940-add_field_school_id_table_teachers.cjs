'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'school_id',{
      type: Sequelize.UUID,
      allowNull: false,
      after: "tenant_id"
    });
    
    await queryInterface.addIndex("teachers",['school_id'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('teachers', 'school_id');
    await queryInterface.removeIndex("teachers",'school_id')
  }
};
