// // script.js file
function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(async function () {
    // Fetch the main CSV data
    const mainCSV = await getFromServer();
    function onScanSuccess(decodeText, decodeResult) {
        processQRCode(decodeText);
    }

    async function processQRCode(decodedText) {
        try {
            // Check if data is loaded
            if (mainCSV.length === 0) {
                printStatus("Failed to load CSV data");
                return;
            }
            // Split the decoded QR code text
            const values = decodedText.split("-").map(v => v.trim());
            console.log("Decoded Values:", values);
            console.log("Main CSV Data:", mainCSV);
            // Find matching objects in the main CSV
            const matchingObjects = mainCSV.filter(obj =>
                values.every(value =>  {
                    Object.values(obj).some(field => field.trim() === value)
                })
            );
            // Check if matches were found
            if (matchingObjects.length > 0) {
                await sendToServer(matchingObjects);
            } else {
                printStatus("No match found in the Database.");
            }
        } catch (error) {
            console.error("Error processing QR code:", error);
            printStatus("Error processing QR code");
        }
    }

    function parseCSV(csvText) {
        const rows = csvText.split('\n').map(row => row.trim());
        const headers = rows[0].split(',');
        return rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index];
                return obj;
            }, {});
        });
    }

    async function sendToServer(matchedObject) {
        try {
            const response = await fetch('/storeEntry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matchedObject)
            });
            const result = await response.json();
            printStatus(result);
        } catch (error) {
            printStatus("Failed to store entry");
        }
    }

    async function getFromServer() {
        try {
            const response = await fetch('/fetchData', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            printStatus("Failed to retrieve entry");
            return [];
        }
    }

    function printStatus(message) {
        document.getElementById("status").innerHTML = message;
    }

    // Initialize QR scanner
    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 30, qrbox: 250 });
    htmlscanner.render(onScanSuccess);
})
