'use strict';

const dotenv = require('dotenv')
const moment = require('moment')
const bcrypt = require('bcrypt')
const {v4} = require('uuid')

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV.trim()}` : '.env'
dotenv.config({
 path: envFile
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [{
      id : v4(),
      tenant_id : null,
      role : 'superadmin',
      name : process.env.DEFAULT_SADMIN_USERNAME,
      email : process.env.DEFAULT_SADMIN_USERNAME,
      username : process.env.DEFAULT_SADMIN_USERNAME,
      password : bcrypt.hashSync(process.env.DEFAULT_SADMIN_PASSWORD,bcrypt.genSaltSync(process.env.SALT)),
      createdAt : moment().format('YYYY-MM-DD hh:mm:ss'),
      updatedAt : moment().format('YYYY-MM-DD hh:mm:ss')
    }]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};
