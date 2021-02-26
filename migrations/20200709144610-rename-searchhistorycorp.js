'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.renameColumn('Searchhistorycorps','function','city'),
    queryInterface.renameColumn('Searchhistorycorps','role','country'),
    queryInterface.renameColumn('Searchhistorycorps','zip_code','emp_count'),
    queryInterface.renameColumn('Searchhistorycorps','salary_range','type')
    ])
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.renameColumn('Searchhistorycorps','city','function'),
    queryInterface.renameColumn('Searchhistorycorps','country','role'),
    queryInterface.renameColumn('Searchhistorycorps','emp_count','zip_code'),
    queryInterface.renameColumn('Searchhistorycorps','type','salary_range')
    ])
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  }
};
