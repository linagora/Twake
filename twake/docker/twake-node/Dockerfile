FROM node:14.17.3-alpine as node-base

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Test Stage
FROM node-base as test

# Development Stage
FROM node-base as development

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
EXPOSE 3000
EXPOSE 9229
CMD ["npm", "run", "dev:debug"]

# Production Stage
FROM node-base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
COPY --from=development /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "serve"]
