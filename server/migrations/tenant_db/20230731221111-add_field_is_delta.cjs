"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("blob_schools", "is_delta", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      after: "action",
    });
    await queryInterface.addColumn("blob_teachers", "is_delta", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      after: "action",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("blob_schools", "is_delta");
    await queryInterface.removeColumn("blob_teachers", "is_delta");
  },
};
