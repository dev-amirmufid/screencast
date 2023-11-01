"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    queryInterface.changeColumn("teachers", "first_name", {
      type: Sequelize.DataTypes.STRING(128),
    });
    queryInterface.changeColumn("teachers", "middle_name", {
      type: Sequelize.DataTypes.STRING(128),
    });
    queryInterface.changeColumn("teachers", "last_name", {
      type: Sequelize.DataTypes.STRING(128),
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
