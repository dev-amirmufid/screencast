"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex("schools", "schools_sourced_id");
    await queryInterface.removeIndex("teachers", "teachers_sourced_id");
    await queryInterface.addIndex("schools", ["sourcedId"], { unique: true });
    await queryInterface.addIndex("teachers", ["sourcedId"], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("schools", "schools_sourced_id");
    await queryInterface.removeIndex("teachers", "teachers_sourced_id");
  },
};
