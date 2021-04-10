# Test Stage

FROM node:12.22.0-alpine as test

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Development Stage

FROM node:12.22.0-alpine as development

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage

FROM node:12.22.0-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "serve"]
