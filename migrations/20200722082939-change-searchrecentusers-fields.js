'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn(
        'Searchhistories',
        'sal_range',
        'skills'
      ),
      queryInterface.addColumn(
        'Searchhistories',
        'city',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'Searchhistories',
        'country',
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        'Searchhistories',
        'experience',
        Sequelize.STRING
      )
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
      queryInterface.removeColumn('Searchhistories','city'),
      queryInterface.removeColumn('Searchhistories','country'),
      queryInterface.removeColumn('Searchhistories','experience'),
      queryInterface.renameColumn('Searchhistories','skills','sal_range')
    ])
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
