exports.seed = knex => knex('users').del()
  .then(function () {
    return knex('users').insert([
      { username: 'admin', password: '$2y$12$esScxxaSfladLyTj33znr.mCf67AGg0aji324j54s5smV74nQYWlK' },
      { username: 'noctus', password: '$2a$10$a0yWB8jbRAp2Si5LLZRwT.5GyXBNQSR2pmCXqw7LPSzWmzn9OXnfi' }
    ]);
  });

