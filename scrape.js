// obtained from https://gist.github.com/Zerquix18/069c414f62e98a4333d1191a3aeb3f7f#file-getallnotes-js

// runs in the browser console at https://etherscan.io/mynotes_address?p=1

const getNotes = (document) => {
  const figure = document.getElementById('SVGdataReport1');
  if (!figure) {
    throw new Error('Could not find SVGdataReport1');
  }

  const table = figure.firstElementChild;
  const body = table.lastElementChild;

  if (body.childNodes[1].childElementCount === 1) {
    return [];
  }

  const list = [];

  body.childNodes.forEach((element) => {
    if (element.nodeName !== 'TR') {
      return;
    }

    const nameTag = element.childNodes[2].textContent;
    const address = element.childNodes[3].childNodes[0].textContent.trim();
    const note = element.childNodes[3].childNodes[1].textContent.trim();
    const dateCreated = element.childNodes[4].textContent;
    list.push({
      address, nameTag, note, dateCreated,
    });
  });

  return list;
};

const getAllNotes = async () => {
  let allNotes = [];
  let i = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://etherscan.io/mynotes_address?p=${i}`;
    const response = await fetch(url);
    const result = await response.text();
    const doc = new window.DOMParser().parseFromString(result, 'text/html');
    const notes = getNotes(doc);
    allNotes = allNotes.concat(notes);

    if (notes.length === 0) {
      break;
    }
    i += 1;
  }

  return allNotes;
};

// eslint-disable-next-line no-console
getAllNotes().then(console.log);
