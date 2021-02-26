'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'corporatemastermappings',
        'is_master',
        {
          type: Sequelize.BOOLEAN
        }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('corporatemastermappings', 'is_master')
    ]);
  }
};
