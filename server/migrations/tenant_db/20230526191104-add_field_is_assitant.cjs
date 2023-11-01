'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'is_assistant',{
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue : false,
      after: "password"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('teachers', 'is_assistant');
  }
};
