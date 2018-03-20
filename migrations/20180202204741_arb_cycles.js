exports.up = knex =>  knex.schema.createTable('arb_cycles', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users');
    table.timestamps();
  });

exports.down = knex => knex.schema.dropTableIfExists('arb_cycles');
