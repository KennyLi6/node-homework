const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus());
console.log("Total Memory:", os.totalmem());


// Path module
console.log("Joined path:", path.join(__dirname, 'sample-files', 'folder', 'file.txt'))

// fs.promises API
async function writeAndReadDemoFile() {
  const demoFile = path.join(sampleFilesDir, 'demo.txt')

  try {
    await fs.promises.writeFile(demoFile, "Hello from fs.promises!", "utf-8");
    const content = await fs.promises.readFile(demoFile, "utf-8");
    console.log("fs.promises read:", content)
  } catch (err) {
    console.log(err.message);
  }
}

writeAndReadDemoFile();

// Streams for large files- log first 40 chars of each chunk
