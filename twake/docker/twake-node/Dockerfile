# Common node machine
FROM node:16-bullseye-slim as node-base

### Install dependancies

#Imagick
RUN apt-get update && apt-get install -y ghostscript && apt-get clean
RUN apt-get update && apt-get install -y graphicsmagick

#Unoconv
RUN apt-get update && apt-get install -y --force-yes unoconv libxml2-dev
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

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
RUN npm install
COPY backend/node/ .
ENV NODE_ENV=${NODE_ENV}
RUN npm run build
RUN rm -R node_modules

# Add frontend into node
ENV NODE_ENV=development
COPY frontend/package*.json public/
RUN cd public && yarn install --network-timeout 1000000000
RUN yarn global add webpack && yarn global add webpack-cli
COPY frontend/* public/
RUN cp public/src/app/environment/environment.ts.dist public/src/app/environment/environment.ts
ENV NODE_ENV=${NODE_ENV}
RUN cd public && yarn build
RUN cd public && rm -R node_modules
RUN mv public/build/* public/

EXPOSE 3000

CMD ["npm", "run", "serve"]


