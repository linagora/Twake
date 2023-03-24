# Common node machine
FROM node:16-bullseye-slim as node-base

### Install dependancies

#Docker mac issue
RUN apt-get update && apt-get install -y libc6
RUN ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

### Install Twake

WORKDIR /usr/src/app
COPY backend/node/package*.json ./

# Test Stage
FROM node-base as test

RUN npm install
COPY backend/node/ .

# Development Stage
FROM node-base as development

RUN npm install -g pino-pretty
RUN npm install -g tsc-watch
RUN npm install
COPY backend/node/ .

CMD ["npm", "run", "dev"]

# Production Stage
FROM node-base as production

ARG NODE_ENV=production

ENV NODE_ENV=development
RUN npm install #Install dev dependancies for build
COPY backend/node/ .
ENV NODE_ENV=${NODE_ENV}
RUN npm run build #Build in production mode
RUN rm -R node_modules
RUN npm install #Install prod dependancies after build

EXPOSE 3000

CMD ["npm", "run", "serve"]


