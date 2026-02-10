const fs = require("fs");
const path = require("path");
const ExifParser = require("exif-parser");

const IMAGE_DIR = __dirname; // change if needed
const OUTPUT = "./manifest.json";

function walk(dir){
  let results=[];

  const list = fs.readdirSync(dir);
  list.forEach(file=>{
    const fullPath = path.join(dir,file);
    const stat = fs.statSync(fullPath);

    if(stat && stat.isDirectory()){
        const skip = ["node_modules",".git"];
        if(skip.includes(path.basename(fullPath))) return;
        results = results.concat(walk(fullPath));
    }else if(/\.(jpg|jpeg|png|webp)$/i.test(file)){
      results.push(fullPath);
    }
  });

  return results;
}

function getExifTimestamp(buffer){
  try{
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    // DateTimeOriginal is best
    if(result.tags.DateTimeOriginal){
      return result.tags.DateTimeOriginal * 1000;
    }

    if(result.tags.CreateDate){
      return result.tags.CreateDate * 1000;
    }
  }catch{}

  return 0;
}

const files = walk(IMAGE_DIR);

const manifest = files.map(file=>{
  const buffer = fs.readFileSync(file);
  const timestamp = getExifTimestamp(buffer);

return {
  file: file.replace(__dirname + path.sep, ""),
  category: path.dirname(file)
    .replace(__dirname + path.sep, "")
    .replace(".", "") || "all",
  timestamp
};

});

manifest.sort((a,b)=> b.timestamp - a.timestamp);

fs.writeFileSync(OUTPUT, JSON.stringify(manifest,null,2));

console.log("✅ manifest.json generated with", manifest.length, "images");
