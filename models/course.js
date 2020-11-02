'use strict';

const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
    Course.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "A Title is required"
                }
            }
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "A Description is required"
                }
            }
        },
        estimatedTime: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        materialsNeeded: {
            type: Sequelize.STRING,
            allowNull: true,
        }
    }, { sequelize });

    Course.associate = (models) => {
      Course.belongsTo(models.User, {
          foreignKey: {
              fieldName: 'userId',
              allowNull: false,
          },
      });
    };
    return Course;
};