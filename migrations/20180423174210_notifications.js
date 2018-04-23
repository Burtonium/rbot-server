exports.up = knex => knex.schema.createTable('notifications', (table) => {
    table.bigIncrements().primary();
    table.bigInteger('user_id').unsigned().references('id').inTable('users').index();
    table.boolean('read').defaultTo(false);
    table.enum('type', ['success', 'warning', 'error']).index();
    table.string('message').notNullable();
    table.timestamps();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('notifications');
