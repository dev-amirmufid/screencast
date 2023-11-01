## HOW TO USE MIGRATIONS

# Create Migration Skeleton
Example :
```
npm run migration:master_db:generate -- --name create_table_users --env development
npm run migration:tenant_db:generate -- --name add_field_expired_date_on_table_rooms --env development
```

# Running Migration
Example :
```
npm run migration:master_db:migrate -- --env development
npm run migration:tenant_db:migrate -- --env development
```

# Create Seeder Skeleton
Example :
```
npm run migration:master_db:seed:generate -- --name dummy_teachers --env development
npm run migration:tenant_db:seed:generate -- --name dummy_teachers --env development
```

# Running Seeder
```
npm run migration:master_db:seed:all -- --env development
npm run migration:tenant_db:seed:all -- --env development
```

https://sequelize.org/docs/v6/other-topics/migrations/
https://sequelize.org/docs/v6/other-topics/query-interface/
https://sequelize.org/api/v6/class/src/dialects/abstract/query-interface.js~queryinterface

# Generate New Model After Migrasion
Example :
```
npm run migration:master_db:model:generate -- --database realcast_master --host localhost --user root --port 3306 --pass ar011011
npm run migration:tenant_db:model:generate -- --database realcast_tenant --host localhost --user root --port 3306 --pass ar011011
```
