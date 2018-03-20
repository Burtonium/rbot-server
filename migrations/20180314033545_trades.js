exports.up = knex => knex.schema.createTable('trades', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('order_id').unsigned().references('id').inTable('orders');
    table.decimal('filled', 30, 15).notNullable();
    table.decimal('price', 30, 15).notNullable();
    table.timestamps();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('trades');
