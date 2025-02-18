const QRCode = require('easyqrcodejs-nodejs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const csvToJson = require('convert-csv-to-json');
const { name } = require('ejs');
const { spawn } = require('child_process');

let date = new Date();
let folderName = `${date.toISOString().slice(0, 19)}`


function fetchCSV(csvPath) {
    var data = fs.readFileSync(csvPath)
    .toString()
    .split('\n')
    .map(e => e.trim())
    .filter(line => line.length > 0)
    .map(e => e.split(',').map(e => e.trim()))
    .filter(row => row.some(cell => cell !== ''));
    data = data.slice(1)
    return data;
}


function createQR(name, number) {
    var options = {
	    text: `${name}-${number}`,
        width: 500,
        height: 500,
        correctLevel : QRCode.CorrectLevel.H,
        quietZone: 0.6,
        logo: "logo.jpg",
        // title: `\n${name}`,
        // titleFont: "normal bold 32px Arial",
        // titleColor: "#000000",
        // titleBackgroundColor: "#fff",
        // titleHeight: 90,
        // titleTop: 25,
        compressionLevel: 0.7,
        quality: 1,
    };

    // New instance with options
    var qr = new QRCode(options);

    // Save QRCode image
    qr.saveImage({
	    path: folderName + `/${name}.png` // save path
    });
}

function createQRs(csvData) {
    for (let i = 0; i < csvData.length; i++) {
        let name = csvData[i][0];
        let number = csvData[i][1]
        createQR(name, number);
    }
}

async function main() {
    const csvPath = process.argv[2];
    const csvData = fetchCSV(csvPath);

    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }

    createQRs(csvData);
}

main();



