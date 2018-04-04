exports.up = knex => knex.schema.createTable('users', (table) => {
  table.bigIncrements().primary();
  table.string('username').notNullable().unique();
  table.string('password').notNullable();
  table.timestamps();
});

exports.down = knex =>  knex.schema.dropTableIfExists('users');
