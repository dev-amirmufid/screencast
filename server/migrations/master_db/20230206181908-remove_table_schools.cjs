'use strict';
const table_name = 'schools'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable(table_name);
  }
};
