# Common node machine
FROM node:14.17.3-alpine as node-base

WORKDIR /usr/src/app
COPY package*.json ./

# Test Stage
FROM node-base as test

RUN npm install
COPY . .

# Development Stage
FROM node-base as development

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm install
COPY . .
EXPOSE 3000
EXPOSE 9229
CMD ["npm", "run", "dev:debug"]

# Production Stage
FROM node-base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm install --only=production
COPY . .
COPY --from=development /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "serve"]
