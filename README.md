# free-space

## Description

This project uses Docker to create a container that runs the following images: Nginx, Next.js app, TUS server and a MySQL database. The Next.js app is a simple file uploader that uses the TUS server to upload files to the server. The MySQL database is used to store the file metadata and Nginx is used to serve the Next.js app and the TUS server.

## Installation

1. Clone the repository
2. Change directory to the root of the project `cd free-space`
3. Create project nerwork `docker network create frspc_network`
4. Run `docker compose -f docker-compose.dev.yml up` to start the development environment
5. Change directory to the Next.js app `cd next-app`
6. Copy the node modules generated by dockerized Next.js to your host so you can develop without errors `sudo docker cp next-app:/app/node_modules ./node_modules`
8. Open your browser and go to `http://localhost` to see the Next.js app

## Prisma edit

Test database: `http://localhost/api/test`

After making changes to the Prisma schema:
    - Update container `docker compose -f docker-compose.dev.yml up --build next-app`
    - Go to docker containers, right click on free-space-next-app and click "Attach Shell"
    - In the new shell run `npx prisma db push` to push the changes to mysql database
    - Close the shell by running `exit` or CTRL+D
    - Change directory to next-app by `cd next-app`
    - Copy the node modules generated by dockerized Next.js to your host so you can develop without errors `sudo docker cp next-app:/app/node_modules ./node_modules` - this is a heavy operation, it takes ~700MB of space

# Run the project
1. Make sure that you are in root(free-space) directory
2. Run `docker compose -f docker-compose.dev.yml up`

# In case of major changes
1. Make sure that you are in root(free-space) directory
2. Run `docker compose -f docker-compose.dev.yml up --build`

