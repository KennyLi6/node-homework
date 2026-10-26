const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Write a sample file for demonstration
const sampleDir = path.join(__dirname, 'sample-files');
const sampleFile = path.join(sampleDir, 'sample.txt');

fs.writeFileSync(sampleFile, 'Hello, async world!','utf-8');

// 1. Callback style
fs.readFile(sampleFile, "utf-8", (err, content) => {
  if (err) {
    console.log(err.message);
    return;
  }

  console.log("Callback:", content);
})

  // Callback hell example (test and leave it in comments):
  // Callback hell is when there are many nested callbacks that are hard to read and maintain

  //fs.readFile('first.txt', 'utf8', (error, firstText) => {
    //if (error) return console.error(error);

    //fs.readFile('second.txt', 'utf8', (error, secondText) => {
      //if (error) return console.error(error);

      //fs.readFile('third.txt', 'utf8', (error, thirdText) => {
        //if (error) return console.error(error);

        //console.log(firstText, secondText, thirdText);
      //});
    //});
  //});

  // 2. Promise style
function readTextFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, "utf-8", (err, content) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(content);
    });
  });
}

readTextFile(sampleFile)
  .then((content) => {
    console.log("Promise:", content)
  })
  .catch((err) => {
    console.log(err.message)
  });

      // 3. Async/Await style
async function run() {
  try {
    const content = await readTextFile(sampleFile);
    console.log("Async/Await:", content)
  } catch (err) {
    console.log(err.message)
  }
}

run();