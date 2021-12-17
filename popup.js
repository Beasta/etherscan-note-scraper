(async () => {

  // Get popup elements
  let [
    divNotOnEtherscan,
    divOnEtherscan,
    btGoToEtherscan,
    btOpenEtherscan,
    btScrape,
    divError
  ] = [
    'not-on-etherscan',
    'on-etherscan',
    'go-to-etherscan',
    'open-etherscan',
    'scrape'
  ].map(id => document.getElementById(id));

  // Check whether the current page is correct
  const [currentTab] = await chrome.tabs.query({ 
    active: true, 
    currentWindow: true 
  });
  // Initially alll divs are hidden
  if (currentTab.url.match(
      /https:\/\/etherscan.io\/mynotes_address(\?p=\d+)?/
  )) {
    divOnEtherscan.style.display = 'block';
  } else {
    divNotOnEtherscan.style.display = 'block';
  }

  btGoToEtherscan.onclick = async () => {
    // Go to https://etherscan.io/mynotes_address on the current tab
    await chrome.tabs.update(currentTab.id, {
      url: 'https://etherscan.io/mynotes_address'
    });
    window.close();
  };

  btOpenEtherscan.onclick = async () => {
    // Open https://etherscan.io/mynotes_addressin in a new tab
    await chrome.tabs.create({
      url: 'https://etherscan.io/mynotes_address',
      active: true
    });
    window.close();
  };

  btScrape.onclick = async () => {
    try {
      // Do scraping
      const notes = await etherScan.getAllNotes();
      if (!notes.length) {
        throw new Error('No notes found');
      }
      const json = JSON.stringify(notes, null, 2);
      // Make the browser download the file
      const 
        link = document.createElement('a'),
        blob = new Blob([json], {type: "octet/stream"}),
        fileName = 'etherscan_notes.json',
        url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.click();
      // That's all
      window.close();
    } catch (err) {
      divError.innerHTML = err.message 
        || 'Could not scrape notes, please try later';
      divError.style.display = 'blank';
    }
  };
})();

