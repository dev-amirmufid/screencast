'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.changeColumn('teachers', 'username', {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    });
    
    queryInterface.changeColumn('teachers', 'password', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    });
    
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('teachers', 'username',{
      allowNull: false,
    });
    await queryInterface.changeColumn('teachers', 'password',{
      allowNull: false,
    });
  }
};
