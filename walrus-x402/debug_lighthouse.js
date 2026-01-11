
const lighthouse = require('@lighthouse-web3/sdk');
const fs = require('fs');
const path = require('path');

// Key from constants.ts
const DEFAULT_KEY = "f6b0d248.2423e721a3ec44508991b6e09adb2048";
// Try to get from env or use default
const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || DEFAULT_KEY;

console.log('Testing Lighthouse Upload...');
console.log('API Key:', apiKey.substring(0, 6) + '...');

async function testUpload() {
    try {
        const text = "Hello Lighthouse Debug";
        const filename = "debug.txt";
        const filePath = path.join(__dirname, filename);

        fs.writeFileSync(filePath, text);

        console.log('Uploading file...');

        // In Node.js, we pass the path
        const response = await lighthouse.upload(
            filePath,
            apiKey
        );

        console.log('Upload Result:', JSON.stringify(response, null, 2));

        // Cleanup
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Upload Failed!');
        console.error(error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUpload();
