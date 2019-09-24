# Pull base image from offical node repository to date 9.0
FROM node:carbon

# Maintainer
LABEL Author="pvsk1919@gmail.com" 

# Add the current working folder as a mapped folder at /usr/src/app
ADD . /usr/src/app

# Set the current working directory to the new mapped folder.
WORKDIR /usr/src/app

RUN node --version
# Install the express generator which gives you also scaffolding tools.
RUN npm install
#RUN npm audit fix
# Expose the node.js port to the Docker host.
EXPOSE 3000

# This is the start the app.
CMD [ "node", "index.js" ]