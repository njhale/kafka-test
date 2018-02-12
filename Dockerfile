FROM node:latest

LABEL maintainer="NJohnHale@gmail.com"

USER root

WORKDIR /app

COPY . .

RUN ls -l

# Install nodemon and node dependencies and allow directory access to the root group
RUN apt-get update -y \
  && apt-get install -y rsync \
  && npm install -g nodemon \
  && npm install \
  && chmod -R 777 /app
  # && chgrp -R 0 /app \
  # && chmod -R g=u /app

# Expose the application port
EXPOSE 8080

# Switch to the unprivileged user
USER 1001

# Declare the entrypoint process
ENTRYPOINT ["/app/entrypoint.sh"]
