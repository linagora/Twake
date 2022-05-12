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

# Add frontend Stage
FROM node-base as with-frontent

ARG NODE_ENV=production

ENV NODE_ENV=development
RUN npm install #Install dev dependancies for build
COPY backend/node/ .
ENV NODE_ENV=${NODE_ENV}
RUN npm run build #Build in production mode
RUN rm -R node_modules
RUN npm install #Install prod dependancies after build

# Add frontend into node
ENV NODE_ENV=development
COPY frontend/ ../public_build/
RUN apt-get install -y build-essential
RUN cd ../public_build && yarn install --network-timeout 1000000000
RUN yarn global add webpack && yarn global add webpack-cli && yarn global add jest
RUN cp ../public_build/src/app/environment/environment.ts.dist ../public_build/src/app/environment/environment.ts
ENV NODE_ENV=${NODE_ENV}
RUN cd ../public_build && yarn build
RUN cd ../public_build && rm -R node_modules
RUN mv ../public_build/build/* public/; rm -R ../public_build


# Development Stage
FROM with-frontent as development

ENV NODE_ENV=development
RUN npm install -g pino-pretty
RUN npm install -g tsc-watch
RUN yarn install
RUN ls
RUN ls public

CMD ["npm", "run", "dev"]


# Production Stage
FROM with-frontent as production

EXPOSE 3000
CMD ["npm", "run", "serve"]
