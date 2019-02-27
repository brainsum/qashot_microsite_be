# QAShot - Microsite Backend

Backend of QAShot microsite

## TODO

- Refactor `queue` and `mailer` to use migrations, too.

## Install

- `cp .env.example .env`
    - Edit `.env` as needed
- `./docker.startup.prod.sh`
- Set up the database
    - Create the database
        - Note: This is handled by the bitnami postgres images.
    - Initialize migrations
        - `docker-compose exec web sh -c "sequelize db:migrate:schema:timestamps:add && sequelize db:migrate"`

## Dev Workflow
### Database

- Enter the container of the given service
    - E.g `docker-compose exec web`
- Run the required command
    - E.g `sequelize migration:generate`
- If your changes affect the model, alter it manually
    - E.g adding a new column to a table via migrations has to be reflected in the model of the table. This (sadly) is not automatic.
    
    ## Docker

- Build new images locally
- Test with the prod commands
- If it's OK push the new image to docker hub

## Deployment

- Update the .env file (if needed)
- Pull images on the target instance
- Run db migrations
