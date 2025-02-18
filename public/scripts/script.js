// // script.js file
function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(async function () {
    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 1, qrbox: 250 });

    const mainCSV = await getFromServer();
    function onScanSuccess(decodeText, decodeResult) {
        processQRCode(decodeText);
    }

    async function processQRCode(decodedText) {
        try {
            if (mainCSV.length === 0) {
                printStatus("Failed to load CSV data");
                return;
            }
            const values = decodedText.split("-").map(v => v.trim());
            const matchingObjects = mainCSV.filter(obj => {
                const isMatch = values.every(value => {
                    const fieldMatch = Object.values(obj).some(field => field.trim() === value);
                    return fieldMatch;
                });
                return isMatch;
            });
            if (matchingObjects.length > 0) {
                await sendToServer(matchingObjects);
            } else {
                printStatus("No match found in the Database.");
            }
        } catch (error) {
            printStatus("Error processing QR code");
        }
    }

    async function sendToServer(matchedObject) {
        try {
            const response = await fetch('/storeEntry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matchedObject[0])
            });
            const result = await response.text();
            printStatus(result);
        } catch (error) {
            printStatus("Failed to store entry");
        }
    }

    async function getFromServer() {
        try {
            const response = await fetch('/fetchData', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();
            return result
        } catch (error) {
            printStatus("Failed to store entry");
        }
    }

    function printStatus(message) {
        document.getElementById("status").innerHTML = message;
    }

    htmlscanner.render(onScanSuccess);
})
