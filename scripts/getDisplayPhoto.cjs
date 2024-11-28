const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function downloadInstagramPhoto(profileUrl, newFileName) {
  try {
    // Fetch the HTML of the profile page
    const { data: html } = await axios.get(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      },
    });

    // Parse the HTML to find the profile picture URL
    const $ = cheerio.load(html);
    const imageUrl = $('meta[property="og:image"]').attr("content");

    if (!imageUrl) {
      throw new Error("Profile picture URL not found");
    }

    console.log("Profile Picture URL:", imageUrl);

    // Fetch the image and save it locally
    const { data: image } = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(newFileName, image);
    console.log(`Profile picture downloaded successfully as '${newFileName}'.`);
  } catch (error) {
    console.error("Error downloading Instagram photo:", error.message);
  }
}

downloadInstagramPhoto("https://www.instagram.com/cooltrev/", "new_name.jpg");
