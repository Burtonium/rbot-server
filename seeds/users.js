exports.seed = knex => knex('users').del()
  .then(function () {
    return knex('users').insert([
      { username: 'admin', password: '$2a$10$46Ikh2Ki3P7iDQrD5eMxMOAGyY.xuQkUlplbmxZoFjzjF/zh51nH2' },
      { username: 'noctus', password: '$2a$10$a0yWB8jbRAp2Si5LLZRwT.5GyXBNQSR2pmCXqw7LPSzWmzn9OXnfi' }
    ]);
  });

