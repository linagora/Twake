# Common node machine
FROM node:16-bullseye-slim as node-base

#Imagick
RUN apt-get update && apt-get install -y ghostscript && apt-get clean
RUN apt-get update && apt-get install -y libmagickwand-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y imagemagick 


#Unoconv
RUN apt-get update && apt-get install -y --force-yes unoconv libxml2-dev
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /usr/src/app
COPY package*.json ./


# Test Stage
FROM node-base as test

RUN npm install
COPY . .

# Development Stage
FROM node-base as development

RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM node-base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm install --only=production
COPY . .
COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "serve"]


