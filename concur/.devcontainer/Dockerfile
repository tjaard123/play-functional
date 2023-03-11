FROM mcr.microsoft.com/devcontainers/javascript-node:0-18
# If you need to install global npm dependencies, it is recommended to place those dependencies in the non-root user directory
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
# Install purescript and spago
RUN npm install -g purescript \
    npm install -g spago