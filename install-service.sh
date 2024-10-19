#!/bin/bash

#run the build command
npm run build

sudo systemctl daemon-reload
sudo systemctl enable $PWD/media-converter-bot.service


sudo systemctl start media-converter-bot.service
