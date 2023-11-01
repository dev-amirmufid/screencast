'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'expiredAt',{
      type: Sequelize.UUID,
      allowNull: true,
      after: "is_disabled"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('rooms', 'expiredAt');
  }
};
