#!/bin/bash

# Run nodemon if we're in dev mode
if [ "$DEV_MODE" = "true" ]
then
  exec nodemon --watch ./dist server.js
else
  exec npm start
fi
