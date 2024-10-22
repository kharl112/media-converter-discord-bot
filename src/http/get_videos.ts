import axios from 'axios';


export interface FileMetaData {
  title: string | null,
  description: string | null,
  ext: string,
  url: string,
}

export const get_fb_video_url = async (link: string): FileMetaData  | null => {

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

  try {
    
    const link_response: any  = await axios.get(link, { headers });
    const data: string = link_response.data;

    //get the sd:video link from the
    const matches: Array<string> | null = data.match(/"browser_native_sd_url":"(.*?)"/) || data.match(/"playable_url":"(.*?)"/) || 
      data.match(/sd_src\s*:\s*"([^"]*)"/) || data.match(/(?<="src":")[^"]*(https:\/\/[^"]*)/);

    if(!matches) return null;

    //we need index matches[2] to get the proper video link
    if(matches.length < 2) return null;

    //hack: url is in escape format - need to parse it using JSON.parse
    const videoUrl: { url: string } = JSON.parse(`{ "url": "${matches[1]}" }`);

    const response = await axios.head(videoUrl.url);
    const contentLength: string | number = response.headers['content-length'];
    const contentType: string = response.headers['content-type'];

    //check if it's a video
    if(!contentType.startsWith('video/')){
      error_log(`ERROR: ${videoUrl}: is not a video`);
      return null;
    } 

    //ignore if the video is greater than 35mb
    if(parseInt(contentLength, 10) >  35 * 1024 * 1024) {
      error_log(`ERROR: ${videoUrl}: video is too large`);
      return null; 
    } 

    return {
      title: null,
      description: null,
      url: videoUrl.url,
      ext: contentType.replace('video/', '')
    };

  } catch(error) {
    console.log(`ERROR: ${error}`);
    return null;
  }
}
