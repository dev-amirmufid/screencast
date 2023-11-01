'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'linkage_type',{
      type: Sequelize.ENUM('local','oidc','lti'),
      allowNull: false,
      after: "name"
    });
    
    await queryInterface.addColumn('tenants', 'limit',{
      type: Sequelize.BOOLEAN,
      allowNull: false,
      after: "linkage_type"
    });
    
    await queryInterface.addColumn('tenants', 'user_limit',{
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "limit"
    });
    
    await queryInterface.addColumn('tenants', 'blob_url',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "user_limit"
    });
    
    await queryInterface.addColumn('tenants', 'blob_key',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "blob_url"
    });
    
    await queryInterface.addColumn('tenants', 'google_client_id',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "blob_key"
    });
    
    await queryInterface.addColumn('tenants', 'microsoft_client_id',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "google_client_id"
    });

    await queryInterface.addIndex("tenants",['linkage_type'])
    await queryInterface.addIndex("tenants",['limit'])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'linkage_type');
    await queryInterface.removeColumn('tenants', 'limit');
    await queryInterface.removeColumn('tenants', 'user_limit');
    await queryInterface.removeColumn('tenants', 'blob_url');
    await queryInterface.removeColumn('tenants', 'blob_key');
    await queryInterface.removeColumn('tenants', 'google_client_id');
    await queryInterface.removeColumn('tenants', 'microsoft_client_id');

    await queryInterface.removeIndex("tenants",'linkage_type')
    await queryInterface.removeIndex("tenants",'limit')
  }
};
