//init config from dotenv
import dotenv from "dotenv";
dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

//discord apis
import { Client, GatewayIntentBits, Collection, Intents, AttachmentBuilder } from "discord.js"

import axios from "axios";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });


import fs from "node:fs";

import https from "https";

client.once('ready', (client) => {
  console.log(`${client.user.tag} has ressurected.`);
});

client.on('messageCreate', (message)  => {
  const content = message.content;

  //check if link is in fb
  if (['facebook.com', 'fb.watch'].every((item) => !content.includes(item))) return;


  //get the link from the message content
  const link = content.match(/(https?:\/\/[^\s]+)/);
  if(!link.length) return;

  //proper header for fb videos
  const headers = {
    "sec-fetch-user": "?1",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-site": "none",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "cache-control": "max-age=0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "authority": "www.facebook.com",
    "upgrade-insecure-requests": "1",
    "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  }


  axios.get(link[0], { headers }).then( async ({ data }) => {
  
    //sd source of the video
    const matches = data.match(/"browser_native_sd_url":"(.*?)"/) || data.match(/"playable_url":"(.*?)"/) || data.match(/sd_src\s*:\s*"([^"]*)"/) || data.match(/(?<="src":")[^"]*(https:\/\/[^"]*)/);

    if(matches.length > 1) {

      //create temp file
      const TMP_FILE_PATH = '/tmp/tmp_fb.mp4';
      const tempFile = fs.createWriteStream(TMP_FILE_PATH);

      //hack, url is in escape format - need to parse it using JSON.parse
      const videoUrl = JSON.parse(`{ "url": "${matches[1]}" }`);

      try {

        const response = await axios.head(videoUrl.url);
        const contentLength: string | number = response.headers['content-length'];
        const contentType: string = response.headers['content-type'];

        //check if it's a video
        if(!contentType.startsWith('video/')) return;

        //ignore if the video is greater than 35mb
        if(parseInt(contentLength, 10) >  35 * 1024 * 1024) return; 



        //process the vidoe url 
        https.get(videoUrl.url, (response) => {

          //apply the stream into the tempFile
          var stream = response.pipe(tempFile);

          stream.on('finish', async () => {
            //read the temp file after finish reading
            const videoOutput = fs.readFileSync(TMP_FILE_PATH);

            //send it to discord as attachment
            await message.reply({ files: [new AttachmentBuilder(videoOutput, { name: 'video.mp4' } )] });
          });

          //debug on error
          stream.on('error', (error) => {
            console.log(error);
          });

        });

        
      } catch(error) {
        console.log(error);
      }
    }
  });
});

client.login(DISCORD_TOKEN);


