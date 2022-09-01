#!/bin/bash
export NODE_ENV=production
pm2 start ./src/index.js --name forex --time