//init config from dotenv
import dotenv from "dotenv";
dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

//discord apis
import { Client, GatewayIntentBits, Collection, Intents, AttachmentBuilder } from "discord.js"

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

import fs from "node:fs";
import https from "https";
import crypto from "crypto";

import { get_fb_video_url, FileMetaData } from "./http/get_videos";

client.on('messageCreate', async (message)  => {
  const content: string | null  = message.content;

  //some returns embed and no content
  if(!content) return;
  
  //get the link from the message content
  const link: Array<string> | null = content.match(/(https?:\/\/[^\s]+)/);

  //match sometimes returns null
  if(!link) return;

  if(!link.length) return;

  let metadata: FileMetaData | null = null;

  //get the metdata 
  //FACEBOOK LINKS 
  if (['facebook.com', 'fb.watch'].some((item) => content.includes(item))) {
    //get the proper video link
    metadata = await get_fb_video_url(link[0]);
  }


  //ignore if theres no url processed
  if(!metadata) return;

  //create TMP FILE in /tmp directory
  const hash: string = crypto.createHash('md5').update(metadata.url).digest('hex');
  const TMP_FILE_PATH: string = '/tmp/' + hash + '.' + metadata.ext;
  const tempFile = fs.createWriteStream(TMP_FILE_PATH);

  //process the vidoe url 
  https.get(metadata.url, (response) => {

    //apply the stream into the tempFile
    var stream = response.pipe(tempFile);

    stream.on('finish', async () => {
      //read the temp file after finish reading
      const videoOutput = fs.readFileSync(TMP_FILE_PATH);

      //send it to discord as attachment
      await message.reply({ files: [new AttachmentBuilder(videoOutput, { name: 'video.mp4' } )] });

      //remove the tmp file
      fs.unlinkSync(TMP_FILE_PATH);
    });

    //debug on error
    stream.on('error', (error) => {
      console.log(error);

      //remove the tmp file
      fs.unlinkSync(TMP_FILE_PATH);
    });

  });

});


//event when bot is ready
client.once('ready', (client) => {
  console.log(`${client.user.tag} has ressurected.`);
});

client.login(DISCORD_TOKEN);


