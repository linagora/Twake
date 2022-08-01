# PluginsServer

A simple to use docker image for Twake plugins. This image use docker in docker to permit to deploy plugin easily and quickly everywhere. Docker in Docker is useful but is not ready for production environment because you need to use the root container with privileged. Furthermore, with Dockerception 127.0.0.1 is not home so this is a little schema to help understanding how this container work with Twake.
![Alt text](twake/plugins/HowItWorks.png "How it works !")

# How to use this image

Here is a picture representing how script works together to let you install and manage plugins easily
![Alt text](twake/plugins/HowScriptsWorks.png "Scripts")

## Start plugin server

docker-compose -f <docker-compose.yml> up -d plugins

## Add a plugin

By using the command below, you clone a plugins repo, add it to a list of already installed plugins, build and run it and start the nginx reverse proxy. After this the plugin will be up and running on a port specified in the plugins.json list.
If you need for example to add environment variable to your plugin you can add it with a string as <environnemen-variable> like this: "-e GIPHY_APIKEY=toto -e GIPHY_SERET=tata"

    docker-compose -f <docker-compose.yml> exec plugins add <plugin-git-repo> <twake-plugin-id> <twake-plugin-secret> <environnement-variable>

## Start all plugins installed

This script will start all plugins installed and saved in plugin.json

    docker-compose -f <docker-compose.yml> exec plugins start

### build already installed plugin

When you already have installed a plugin, Add script will not install a plugin a second time. So you can check the configuration in plugin.json a use build script to build your image.

    docker-compose -f <docker-compose.yml> exec plugins build <plugin-git-repo>

### Run already installed and built plugin

If your plugin is installed and the image associated is built, just run the plugin. Before running a plugin manually check if the network (docker network ls) is already created, if not restart your nginx with script start_nginx.

    docker-compose -f <docker-compose.yml> exec plugins start_nginx && docker-compose -f <docker-compose.yml> exec plugins up <plugin-name>

## Update a plugin

To update a plugin, use the update script that will pull last version of the plugin on github.

    docker-compose -f <docker-compose.yml> exec plugins update <plugin-name>

## delete a plugin

    docker-compose -f <docker-compose.yml> exec plugins delete <plugin-name>

## list all plugin installed

    docker-compose -f <docker-compose.yml> exec plugins list

## Start Nginx

    docker-compose -f <docker-compose.yml> exec plugins start_nginx
