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

    let addressNotes; // address notes returned from a scrape

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
        scrapeButton.disabled = "true"; // disable the SCRAPER button while scraping
        scrapeButton.innerText = "SCRAPING...";

        const tab = await getTab(); // retrieve the currently focused tab

        if (tab.url.match(/https:\/\/etherscan.io\/mynotes_address(\?p=1)?/)) {
            try {
                addressNotes = await getAllNotes();

                if (addressNotes.length === 0) {
                    generateError("There are no address notes");
                } else {
                    document.getElementById("download").style.display = "block";
                    document.getElementById("scrape").style.display = "none";
                }
            } catch (err) {
                generateError(err.message);
            }
        } else {
            document.getElementById("prompt").style.display = "block";
            document.getElementById("scrape").style.display = "none";
            scrapeButton.disabled = "false"; // enable the SCRAPER button for another attempt to scrape
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
     * Displays an error message to the popup window
     * @param message the error message
     */
    function generateError(message) {
        // TODO
        window.close();
    }
});