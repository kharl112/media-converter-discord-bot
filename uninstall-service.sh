#!/bin/bash

sudo systemctl daemon-reload

sudo systemctl stop media-converter-bot.service                                                                                                                                                       
sudo systemctl disable $PWD/media-converter-bot.service