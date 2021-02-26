#!/bin/bash

mkdir /home/ubuntu/nodejs
cd /home/ubuntu/nodejs
sudo rm -rf package-lock.json
sudo rm -rf node_modules
sudo npm install --ignore-scripts
