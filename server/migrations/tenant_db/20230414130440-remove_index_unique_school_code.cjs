'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeIndex("schools",'schools_school_code')
    await queryInterface.addIndex("schools",['school_code'])
  },

  async down (queryInterface, Sequelize) {
  }
};
