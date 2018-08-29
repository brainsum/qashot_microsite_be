'use strict';

const DataTypes = require('sequelize');

module.exports = {
    attributes: {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    },
    options: {
        timestamps: false
    }
};
