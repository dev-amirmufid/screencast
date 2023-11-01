'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex("teachers",['sourcedId'])
    await queryInterface.addIndex("teachers",['tenant_id'])
    await queryInterface.addIndex("teachers",['username'])
    await queryInterface.addIndex("teachers",['email'])

    await queryInterface.addIndex("rooms",['teacher_id'])
    await queryInterface.addIndex("rooms",['uri'],{unique:true})
    await queryInterface.addIndex("rooms",['is_disabled'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex("teachers",'teachers_sourcedId')
    await queryInterface.removeIndex("teachers",'teachers_tenant_id')
    await queryInterface.removeIndex("teachers",'teachers_username')
    await queryInterface.removeIndex("teachers",'teachers_email')

    await queryInterface.removeIndex("rooms",'rooms_teacher_id')
    await queryInterface.removeIndex("rooms",'rooms_uri')
    await queryInterface.removeIndex("rooms",'rooms_is_disabled')
  }
};
