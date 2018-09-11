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
            allowNull: false,
            unique: true
        },
        waitUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        received: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        receivedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rawData: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    },
    options: {
        timestamps: false
    }
};
