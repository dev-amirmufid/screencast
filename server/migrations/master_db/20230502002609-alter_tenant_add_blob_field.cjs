'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'blob_tenant_name',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "blob_key"
    });
    await queryInterface.addColumn('tenants', 'use_blob_sync',{
      type: Sequelize.BOOLEAN,
      allowNull: true,
      after: "blob_tenant_name"
    });
    await queryInterface.addColumn('tenants', 'use_blob_tenant_name',{
      type: Sequelize.BOOLEAN,
      allowNull: true,
      after: "use_blob_sync"
    });
    await queryInterface.addColumn('tenants', 'sync_status',{
      type: Sequelize.BOOLEAN,
      allowNull: true,
      after: "use_blob_tenant_name"
    });
    await queryInterface.addColumn('tenants', 'job_id',{
      type: Sequelize.STRING,
      allowNull: true,
      after: "sync_status"
    });
    await queryInterface.addColumn('tenants', 'last_sync',{
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      after: "job_id"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'blob_tenant_name');
    await queryInterface.removeColumn('tenants', 'use_blob_sync');
    await queryInterface.removeColumn('tenants', 'use_blob_tenant_name');
    await queryInterface.removeColumn('tenants', 'sync_status');
    await queryInterface.removeColumn('tenants', 'job_id');
    await queryInterface.removeColumn('tenants', 'last_sync');
  }
};
