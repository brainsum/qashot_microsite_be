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
            allowNull: false,
            unique: true
        },
        waitUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    options: {
        timestamps: false
    }
};
