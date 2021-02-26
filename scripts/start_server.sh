#!/bin/bash
mkdir /home/ubuntu/nodejs
cd /home/ubuntu/nodejs
pm2 stop matchupit_backend
sudo npm run prod
