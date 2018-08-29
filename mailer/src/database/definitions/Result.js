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
        raw_data: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    },
    options: {
        timestamps: false
    }
};
