'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Searchhistorycorps',
        'name',
        Sequelize.BOOLEAN
      ),
      queryInterface.addColumn(
        'Searchhistories',
        'name',
        Sequelize.BOOLEAN
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Searchhistories', 'name'),
      queryInterface.removeColumn('Searchhistorycorps', 'name')
    ])
  }
};
