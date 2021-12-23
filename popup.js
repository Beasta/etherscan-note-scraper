/**
 * Chrome extension popup for scraping EtherScan.io address notes
 */

/**
 * Event handler for when the HTML popup is loaded and parsed.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const scrapeButton = document.getElementById('scrapeButton');
  const yesButton = document.getElementById('yesButton');
  const noButton = document.getElementById('noButton');
  const downloadButton = document.getElementById('downloadButton');
  const searchButton = document.getElementById('searchButton');

  let addressNotes; // address notes returned from a scrape
  let displayNotes; // address notes being displayed in a table, whether all or just those returned from a search

  /**
     * Retrieves the currently focused tab
     * @returns {Promise<*>}
     */
  async function getTab() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  /**
     * Boolean conditional for if the currently focused tab is: https://etherscan.io/mynotes_address?p=1
     * @returns {Promise<RegExpMatchArray>}
     */
  async function isTabOnEtherScanAddressNotesPage() {
    const tab = await getTab(); // retrieve the currently focused tab
    return tab.url.match(/https:\/\/etherscan.io\/mynotes_address(\?p=1)?/);
  }

  /**
   * Generates a table containing scraped address note values separated in rows by addresses.
   * Either displays all scraped address note values, or address note values returned in a search.
   */

  function generateNotesTable() {
    const div = document.getElementById('notes-table');
    div.innerHTML = '';

    // persistently store the address note data
    chrome.storage.sync.set({
      addressNotes,
      displayNotes,
    });

    if (addressNotes && addressNotes.length > 0) {
      document.getElementById('search').style.display = 'block';
      document.getElementById('downloadButton').style.display = 'block';

      const table = document.createElement('table');
      const tableBody = document.createElement('tbody');

      // table headers
      let row = document.createElement('tr');

      let cell = document.createElement('th');
      let cellText = document.createTextNode('Address');
      cell.appendChild(cellText);
      row.appendChild(cell);

      cell = document.createElement('th');
      cellText = document.createTextNode('Name Tag');
      cell.appendChild(cellText);
      row.appendChild(cell);

      cell = document.createElement('th');
      cellText = document.createTextNode('Note');
      cell.appendChild(cellText);
      row.appendChild(cell);

      cell = document.createElement('th');
      cellText = document.createTextNode('Date Created');
      cell.appendChild(cellText);
      row.appendChild(cell);

      tableBody.appendChild(row);

      // table rows
      for (let i = 0; i < displayNotes.length; i += 1) {
        row = document.createElement('tr');

        cell = document.createElement('td');
        cellText = document.createTextNode(displayNotes[i].address);
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement('td');
        cellText = document.createTextNode(displayNotes[i].nameTag);
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement('td');
        cellText = document.createTextNode(displayNotes[i].note);
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement('td');
        cellText = document.createTextNode(displayNotes[i].dateCreated);
        cell.appendChild(cellText);
        row.appendChild(cell);

        tableBody.appendChild(row);
      }

      table.appendChild(tableBody);
      div.appendChild(table);
    } else {
      document.getElementById('search').style.display = 'none';
      document.getElementById('downloadButton').style.display = 'none';

      const paragraph = document.createElement('p');
      paragraph.innerHTML = 'There are no address notes';
      div.appendChild(paragraph);
    }
  }

  /**
   * Displays a prompt for opening: https://etherscan.io/mynotes_address?p=1
   * Hides SCRAPE button and any scraped address note data, along with the search feature and download button
   */
  function promptToOpenEtherScanAddressNotesPage() {
    document.getElementById('prompt').style.display = 'block';
    document.getElementById('scrape').style.display = 'none';
    document.getElementById('notes').style.display = 'none';
  }

  /**
   * Get data from storage when popup loads and display any stored address note values in a table
   */
  chrome.storage.sync.get(['addressNotes', 'displayNotes'], async (storedData) => {
    addressNotes = storedData.addressNotes;
    displayNotes = storedData.displayNotes;

    if (addressNotes) {
      if (await isTabOnEtherScanAddressNotesPage()) {
        generateNotesTable();
      } else {
        promptToOpenEtherScanAddressNotesPage();
      }
    }
  });

  /**
   * Displays an error message to the popup window
   * @param message the error message
   */
  function generateError(message) {
    document.getElementById('notes').style.display = 'none';
    document.getElementById('scrape').style.display = 'block';

    const div = document.getElementById('scrape');
    const paragraph = document.createElement('p');
    paragraph.innerHTML = `Scraping returned error: ${message}`;
    div.appendChild(paragraph);
  }

  /**
     * Event handler for when the SCRAPER button is clicked.
     * Address notes are scraped if the currently focused tab is 'https://etherscan.io/mynotes_address?p=1'.
     * Otherwise, user is prompted to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     */
  scrapeButton.addEventListener('click', async () => {
    if (await isTabOnEtherScanAddressNotesPage()) {
      try {
        scrapeButton.disabled = true; // disable the SCRAPE button while scraping address notes
        scrapeButton.innerText = 'SCRAPING...';

        addressNotes = await getAllNotes(); // eslint-disable-line no-undef
        displayNotes = addressNotes;
        generateNotesTable();

        scrapeButton.disabled = false; // re-enable the SCRAPE button while scraping address notes
        scrapeButton.innerText = 'SCRAPE';

        // remove any prior search from the input element
        if (addressNotes.length === displayNotes.length) {
          document.getElementById('searchInput').value = '';
        }
      } catch (err) {
        generateError(err.message);
      }
    } else {
      promptToOpenEtherScanAddressNotesPage();
    }
  });

  /**
     * Event handler for when a user accepts the prompt to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     * Re-displays the SCRAPER button prompt.
     */
  yesButton.addEventListener('click', async () => {
    const tab = await getTab();
    await chrome.tabs.update(tab.id, { url: 'https://etherscan.io/mynotes_address?p=1' });

    if (addressNotes !== null) {
      generateNotesTable();
    }

    document.getElementById('scrape').style.display = 'block';
    document.getElementById('notes').style.display = 'block';
    document.getElementById('prompt').style.display = 'none';
  });

  /**
     * Event handler for when a user declines the prompt to open the tab to 'https://etherscan.io/mynotes_address?p=1'.
     * Closes the window.
     */
  noButton.addEventListener('click', async () => {
    window.close();
  });

  /**
     * Event handler for when the DOWNLOAD button is clicked.
     * Downloads the scraped address notes in JSON format.
     * Closes the window.
     */
  downloadButton.addEventListener('click', async () => {
    downloadButton.disabled = true; // disable the DOWNLOAD button while downloading JSON file
    downloadButton.innerText = 'DOWNLOADING...';

    const dataString = `data:text/json;charset=utf-8,${
      encodeURIComponent(JSON.stringify(addressNotes))
    }`;
    const downloadAnchor = document.getElementById('downloadAnchor');
    downloadAnchor.setAttribute('href', dataString);
    downloadAnchor.setAttribute('download', 'EtherScanAddressNotes.json');
    downloadAnchor.click();

    window.close();
  });

  /**
     * Event handler for when the SEARCH button is clicked.
     * Displays in a table only the address notes with values which include the search text, case-insensitive.
     * If the search text is empty, the table displays all address note values retrieved from the scraper.
     */
  searchButton.addEventListener('click', async () => {
    let searchTxt = document.getElementById('searchInput').value;

    if (searchTxt.length === 0 || searchTxt === '') {
      displayNotes = addressNotes;
    } else {
      displayNotes = [];
      searchTxt = searchTxt.toLowerCase();

      for (let i = 0; i < addressNotes.length; i += 1) {
        if (addressNotes[i].address.toLowerCase().includes(searchTxt)
                    || addressNotes[i].nameTag.toLowerCase().includes(searchTxt)
                    || addressNotes[i].note.toLowerCase().includes(searchTxt)
                    || addressNotes[i].dateCreated.toLowerCase().includes(searchTxt)) {
          displayNotes.push(addressNotes[i]);
        }
      }
    }
    generateNotesTable();
  });
});
