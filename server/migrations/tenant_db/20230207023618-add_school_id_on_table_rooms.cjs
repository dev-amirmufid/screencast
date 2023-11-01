'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'school_id',{
      type: Sequelize.UUID,
      allowNull: false,
      after: "tenant_id"
    });
    
    await queryInterface.addIndex("rooms",['school_id'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('rooms', 'school_id');
    await queryInterface.removeIndex("rooms",'school_id')
  }
};
