'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'corporates',
        'is_active',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('corporates', 'is_active')
    ]);
  }
};
