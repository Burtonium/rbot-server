exports.up = knex => knex.schema.createTable('api_calls', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('exchange_id').unsigned().references('id').inTable('exchanges').notNullable();
    table.string('method');
    table.integer('latency').notNullable();
    table.dateTime('timestamp').defaultTo(knex.fn.now()).index();
});

exports.down = knex =>  knex.schema.dropTableIfExists('api_calls');
