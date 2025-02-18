// index.js
const ip = require('./lib/ip');
const https = require('https');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const { get } = require('http');
const express = require('express');
const app = express();
const httpPort = 8080;
const httpsPort = 443;

var options = {
    key: fs.readFileSync('certs/localhost.key'),
    cert: fs.readFileSync('certs/localhost.crt')
};

// Serve static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware (for POST requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get("/", (req, res) => {
    const htmlContent = `
    <div class="container">
        <h1>Event Scanner</h1>
        <div class="section">
            <div id="my-qr-reader"></div>
        </div>
        <h1 id="status"></h1>
    </div>
    <script src="scripts/qrcode.js"></script>
    <script src="scripts/script.js"></script>
    `;
    res.render('home', { variableName: htmlContent });
})

function fetchMainCSV(csvPath) {
    return fetch(csvPath)
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n').map(row => row.trim());
            const headers = rows[0].split(',');
            const csvData = [];
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',');
                const rowObject = {};
                headers.forEach((header, index) => rowObject[header] = values[index]);
                csvData.push(rowObject);
            }
            return csvData;
        }).catch(error => {
            console.error('Error loading CSV:', error);
            return [];
        });
}

app.get("/fetchData", (req, res) => {
    const csvPath = path.join(__dirname, "file.csv");
    const data = [];

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => data.push(row))
        .on('end', () => {
            res.json(data);
        })
        .on('error', (error) => {
            console.error("Error reading CSV:", error);
            res.status(500).send("Error reading CSV");
        });
});

app.post('/storeEntry', (req, res) => {
    try {
        const entry = req.body;
        const date = getLocalDate();
        console.log(date);
        const entriesDir = path.join(__dirname, 'entries');
        const entriesFilePath = path.join(entriesDir, `${date}_entries.csv`);
        // Ensure entries directory exists
        if (!fs.existsSync(entriesDir)) {
            fs.mkdirSync(entriesDir, { recursive: true });
        }
        // Check if file exists and read existing entries
        if (fs.existsSync(entriesFilePath)) {
            const existingData = fs.readFileSync(entriesFilePath, 'utf8');
            const existingEntries = existingData.split('\n').slice(1); // Skip headers
            // Check for duplicate entry
            const isDuplicate = existingEntries.some(existingEntry =>
                existingEntry.includes(Object.values(entry).join(','))
            );
            if (isDuplicate) {
                return res.status(400).send("QR code already scanned");
            }
        }
        // Prepare CSV row
        const csvRow = Object.values(entry).join(',') + '\n';
        // Write or append data
        if (!fs.existsSync(entriesFilePath)) {
            const headers = Object.keys(entry).join(',') + '\n';
            fs.writeFileSync(entriesFilePath, headers + csvRow);
        } else {
            fs.appendFileSync(entriesFilePath, csvRow);
        }
        res.send("Entry stored successfully");
    } catch (error) {
        console.error("Error storing entry:", error);
        res.status(500).send("Error storing entry");
    }
});

// Helper function to read existing entries
function readExistingEntries(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            resolve(results);
            return;
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

function getLocalDate() {
    const localDate = new Date();
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().split('T')[0];
}

// Start the server
// app.listen(httpPort, () => {
//     console.log(`Server running at http://localhost:${httpPort}`);
// });

var server = https.createServer(options, app);

server.listen(httpsPort, () => {
    console.log(`Server running at https://localhost:${httpsPort} or https://${ip.address()}:${httpsPort}`);
});
