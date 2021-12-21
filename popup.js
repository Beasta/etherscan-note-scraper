/**
 * Chrome extension popup for scraping EtherScan.io address notes
 */

/**
 * Event handler for when the HTML popup is loaded and parsed.
 */
document.addEventListener('DOMContentLoaded', async() => {
    const scrapeButton = document.getElementById("scrapeButton");
    const yesButton = document.getElementById("yesButton");
    const noButton = document.getElementById("noButton");
    const downloadButton = document.getElementById("downloadButton");
    const searchButton = document.getElementById("searchButton");

    let addressNotes; // address notes returned from a scrape
    let displayNotes; // address notes being displayed in a table, whether all or just those returned from a search
    chrome.storage.sync.get(/* String or Array */["data"], function(items){
        //  items = [ { "phasersTo": "awesome" } ]
        addressNotes = items.data;
        displayNotes = items.data;
        // alert(displayNotes.length);
        if(addressNotes.length > 0){
            generateNotesTable();
        }
        // console.log(items);
    });
    /**
     * Retrieves the currently focused tab
     * @returns {Promise<*>}
     */
    async function getTab() {
        const queryOptions = {active: true, currentWindow: true};
        const [tab] = await chrome.tabs.query(queryOptions);
        return tab;
    }

    /**
     * Event handler for when the SCRAPER button is clicked.
     * Address notes are scraped if the currently focused tab is 'https://etherscan.io/mynotes_address?p=1'.
     * Otherwise, user is prompted to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     */
    scrapeButton.addEventListener("click", async () => {
        const tab = await getTab(); // retrieve the currently focused tab

        if (tab.url.match(/https:\/\/etherscan.io\/mynotes_address(\?p=1)?/)) {
            scrapeButton.disabled = "true";
            scrapeButton.innerText = "SCRAPING...";

            try {
                addressNotes = await getAllNotes();
                displayNotes = addressNotes;
                generateNotesTable();
            } catch (err) {
                generateError(err.message);
            }
        } else {
            document.getElementById("prompt").style.display = "block";
            document.getElementById("scrape").style.display = "none";
        }
    });

    /**
     * Event handler for when a user accepts the prompt to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     * Re-displays the SCRAPER button prompt.
     */
    yesButton.addEventListener("click", async () => {
        const tab = await getTab();
        await chrome.tabs.update(tab.id, { url: "https://etherscan.io/mynotes_address?p=1" });

        document.getElementById("scrape").style.display = "block";
        document.getElementById("prompt").style.display = "none";
    });

    /**
     * Event handler for when a user declines the prompt to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     * Closes the window.
     */
    noButton.addEventListener("click", async () => {
        window.close();
    });

    /**
     * Event handler for when the DOWNLOAD button is clicked.
     * Downloads the scraped address notes in JSON format.
     * Closes the window.
     */
    downloadButton.addEventListener("click", async () => {
        downloadButton.disabled = "true"; // disable the DOWNLOAD button while downloading JSON file
        downloadButton.innerText = "DOWNLOADING...";

        const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(addressNotes));
        const downloadAnchor = document.getElementById('downloadAnchor');
        downloadAnchor.setAttribute("href", dataString);
        downloadAnchor.setAttribute("download", "EtherScanAddressNotes.json");
        downloadAnchor.click();

        window.close();
    });

    /**
     * Event handler for when the SEARCH button is clicked.
     * Displays in a table only the address notes with values which include the search text, case-insensitive.
     * If the search text is empty, the table displays all address note values retrieved from the scraper.
     */
    searchButton.addEventListener("click", async () => {
        let searchTxt = document.getElementById("searchInput").value;

        if (searchTxt.length === 0 || searchTxt === "") {
            displayNotes = addressNotes;
        } else {
            displayNotes = [];
            searchTxt = searchTxt.toLowerCase();

            for (let i = 0; i < addressNotes.length; i++) {
                if (addressNotes[i].address.toLowerCase().includes(searchTxt) ||
                    addressNotes[i].nameTag.toLowerCase().includes(searchTxt) ||
                    addressNotes[i].note.toLowerCase().includes(searchTxt) ||
                    addressNotes[i].dateCreated.toLowerCase().includes(searchTxt)) {
                    displayNotes.push(addressNotes[i]);
                }
            }
        }
        generateNotesTable();
    });

    /**
     * Generates a table containing scraped address note values separated in rows by addresses.
     * Either displays all scraped address note values, or address note values returned in a search.
     */
    function generateNotesTable() {
        chrome.storage.sync.set({ "data": displayNotes}, function(){
            // alert("hello");
        });
        if (addressNotes.length === 0) {
            generateError("There are no address notes");
        } else {
          
            // chrome.storage.sync.set({ "data2": displayNotes}, function(){
            //     // alert("hello");
            // });

            document.getElementById("notes").style.display = "block";
            document.getElementById("search").style.display = "block";
            // document.getElementById("scrape").style.display = "none";
            document.getElementById("downloadButton").style.display = "block";
            scrapeButton.innerText = "SCRAPE";
            let div = document.getElementById("notes-table");
            let table = document.createElement("table");
            let tableBody = document.createElement("tbody");

            // table headers
            let row = document.createElement("tr");

            let cell = document.createElement("th");
            let cellText = document.createTextNode("Address");
            cell.appendChild(cellText);
            row.appendChild(cell);

            cell = document.createElement("th");
            cellText = document.createTextNode("Name Tag");
            cell.appendChild(cellText);
            row.appendChild(cell);

            cell = document.createElement("th");
            cellText = document.createTextNode("Note");
            cell.appendChild(cellText);
            row.appendChild(cell);

            cell = document.createElement("th");
            cellText = document.createTextNode("Date Created");
            cell.appendChild(cellText);
            row.appendChild(cell);

            tableBody.appendChild(row);

            // table rows
            for (let i = 0; i < displayNotes.length; i++) {
                row = document.createElement("tr");

                cell = document.createElement("td");
                cellText = document.createTextNode(displayNotes[i].address);
                cell.appendChild(cellText);
                row.appendChild(cell);

                cell = document.createElement("td");
                cellText = document.createTextNode(displayNotes[i].nameTag);
                cell.appendChild(cellText);
                row.appendChild(cell);

                cell = document.createElement("td");
                cellText = document.createTextNode(displayNotes[i].note);
                cell.appendChild(cellText);
                row.appendChild(cell);

                cell = document.createElement("td");
                cellText = document.createTextNode(displayNotes[i].dateCreated);
                cell.appendChild(cellText);
                row.appendChild(cell);

                tableBody.appendChild(row);
            }

            table.appendChild(tableBody);
            div.innerHTML = "";
            div.appendChild(table);
        }
    }

    /**
     * Displays an error message to the popup window
     * @param message the error message
     */
    function generateError(message) {
        document.getElementById("notes").style.display = "block";
        document.getElementById("scrape").style.display = "none";

        let div = document.getElementById("notes");
        let paragraph = document.createElement("p");
        paragraph.innerHTML = "Scraping returned error: " + message;
        div.appendChild(paragraph);
    }
});