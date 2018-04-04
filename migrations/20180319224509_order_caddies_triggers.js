exports.up = knex => knex.schema.createTable('order_caddies_triggers', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('order_caddies_id').unsigned().references('id').inTable('order_caddies').index();
    table.bigInteger('order_id').unsigned().references('id').inTable('orders').index();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('order_caddies_triggers');
