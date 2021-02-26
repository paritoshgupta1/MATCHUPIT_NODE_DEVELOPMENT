'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'corporatemastermappings',
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
      queryInterface.removeColumn('corporatemastermappings', 'is_active')
    ]);
  }
};
