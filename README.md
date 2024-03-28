# free-space

## Description

This project uses Docker to create a container that runs the following images: Nginx, Next.js app, TUS server and a MySQL database. The Next.js app is a simple file uploader that uses the TUS server to upload files to the server. The MySQL database is used to store the file metadata and Nginx is used to serve the Next.js app and the TUS server.

## Installation

1. Clone the repository
2. Run `docker compose -f docker-compose.dev.yml up` to start the development environment
3. sudo docker cp next-app:/app/node_modules ./next-app/node_modules
3. Open your browser and go to `http://localhost` to see the Next.js app