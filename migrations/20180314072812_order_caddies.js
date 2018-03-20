exports.up = knex => knex.schema.createTable('order_caddies', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users').notNullable();
    table.string('label');
    table.bigInteger('currency_pair_id').references('id').inTable('currency_pairs');
    table.decimal('min_profitability_percent', 7, 4).notNullable();
    table.boolean('active').defaultTo(true);
    table.timestamps();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('order_caddies');
