'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Searchhistories',
        'function',
        Sequelize.STRING
      ),
      queryInterface.removeColumn('Searchhistories','region'),
      queryInterface.removeColumn('Searchhistories','experience')
    ])
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Searchhistories','function'),
      queryInterface.addColumn('Searchhistories','region',Sequelize.STRING),
      queryInterface.addColumn('Searchhistories','experience',Sequelize.STRING)
    ])
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
