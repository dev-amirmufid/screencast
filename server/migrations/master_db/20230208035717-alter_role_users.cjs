'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.changeColumn('users','role',{
      type: Sequelize.STRING(100),
      allowNull:false
    })
    queryInterface.addColumn('users', 'school_id',{
      type: Sequelize.STRING(100),
      allowNull: true,
      after: "tenant_id"
    });
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
