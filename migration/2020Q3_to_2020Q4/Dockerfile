FROM php:7.1.11-fpm

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y nodejs yarn

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN yarn install

COPY . .

EXPOSE 8080

CMD [ "yarn", "start" ]