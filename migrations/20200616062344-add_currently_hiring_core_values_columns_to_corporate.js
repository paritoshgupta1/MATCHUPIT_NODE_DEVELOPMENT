'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'corporates',
        'currently_hiring',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        }
      ),
      queryInterface.addColumn(
        'corporates',
        'core_values',
        {
          type: Sequelize.STRING(300)
        }
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('corporates', 'currently_hiring'),
      queryInterface.removeColumn('corporates', 'core_values')
    ]);
  }
};
