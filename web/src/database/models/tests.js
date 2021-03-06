'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Tests',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            reference_url: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            test_url: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
            uuid: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                unique: true
            },
            newsletter: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            privacy_policy: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            timestamps: false,
        }
    );
};
