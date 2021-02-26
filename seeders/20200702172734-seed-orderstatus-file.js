"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "orderstatuses",
      [
        {
          name: "initiated",
          description: "Initiated",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "success",
          description: "Succes",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "waiting for payment",
          description: "Waiting For Payment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "cancelled",
          description: "Cancelled",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "refund",
          description: "Refund",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "invalid order",
          description: "Invalid Order",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "under process",
          description: "Under Process",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("orderstatuses", [
      {
        name: "success",
      },
      {
        name: "cancelled",
      },
      {
        name: "initiated",
      },
      {
        name: "waiting for payment",
      },
      {
        name: "refund",
      },
      {
        name: "invalid order",
      },
      {
        name: "under process",
      },
    ]);
  },
};
