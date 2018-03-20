exports.up = knex => knex.schema.createTable('orders', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users');
    table.bigInteger('market_id').unsigned().references('id').inTable('markets').index();
    table.enum('status', ['open', 'closed', 'error']).notNullable().defaultTo('open');
    table.enum('type', ['market', 'limit']).notNullable();
    table.enum('side', ['buy', 'sell']).notNullable();
    table.decimal('amount', 30, 15).notNullable();
    table.decimal('limit_price', 30, 15);
    table.timestamps();
  });

exports.down = knex => knex.schema.dropTableIfExists('orders');
