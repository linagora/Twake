# Common node machine
FROM node:lts as node-base

### Install dependancies
RUN apt-get update && \
    apt-get install -y ghostscript graphicsmagick wget unoconv libxml2-dev ffmpeg python-is-python3 && \
    # upgrade unoconv
    wget -N https://raw.githubusercontent.com/dagwieers/unoconv/master/unoconv -O /usr/bin/unoconv && \
    chmod +x /usr/bin/unoconv
#Docker mac issue
# RUN apt-get update && apt-get install -y libc6
# RUN ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2


### Install Twake

WORKDIR /usr/src/app
COPY backend/node/package*.json ./

# Test Stage
FROM node-base as test

RUN npm install
COPY backend/node/ .

# Add frontend Stage
FROM node-base as with-frontend

COPY backend/node/ .
#Install dev dependancies for build
RUN NODE_ENV=development npm install && \
    #Build in production mode
    export NODE_ENV=production && \
    npm run build && \
    rm -rf node_modules && \
    #Install prod dependancies after build
    npm install --legacy-peer-deps

# Add frontend into node
COPY frontend/ ../public_build/
RUN export NODE_ENV=development && \
    apt-get install -y build-essential && \
    cd ../public_build/ && \
    yarn install --network-timeout 1000000000 && \
    yarn global add webpack webpack-cli jest && \
    cp src/app/environment/environment.ts.dist src/app/environment/environment.ts && \
    export NODE_ENV=production && \
    yarn build && \
    rm -R node_modules && \
    mv build/* ../app/public && \
    cd .. && rm -R public_build/

# Development Stage
FROM with-frontend as development

ENV NODE_ENV=development
RUN npm install -g pino-pretty && \
    npm install -g tsc-watch && \
    yarn install
CMD ["npm", "run", "dev:debug"]

# Production Stage
FROM with-frontend as production

EXPOSE 3000
CMD ["npm", "run", "serve"]
