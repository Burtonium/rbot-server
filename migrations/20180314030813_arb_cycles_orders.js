exports.up = knex => knex.schema.createTable('arb_cycle_orders', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('order_id').unsigned().references('id').inTable('orders');
    table.bigInteger('arb_cycle_id').unsigned().references('id').inTable('arb_cycles');
  });

exports.down = knex =>  knex.schema.dropTableIfExists('arb_cycle_orders');
