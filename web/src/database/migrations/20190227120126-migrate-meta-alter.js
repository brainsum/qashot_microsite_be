'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
        'SequelizeMeta',
        'createdAt',
        {
          type: 'TIMESTAMP',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        }
    );

    await queryInterface.changeColumn(
        'SequelizeMeta',
        'updatedAt',
        {
          type: 'TIMESTAMP',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        }
    );

    return Promise.resolve();
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  }
};
