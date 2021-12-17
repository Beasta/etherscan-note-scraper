// obtained from https://gist.github.com/Zerquix18/069c414f62e98a4333d1191a3aeb3f7f

// runs in the browser console at https://etherscan.io/mynotes_address?p=1
const getNotes = () => {
  const figure = document.getElementById('SVGdataReport1');
  if (! figure) {
    throw new Error('Could not find SVGdataReport1')
  }

  const table = figure.firstElementChild;
  const body = table.lastElementChild;

  const list = [];

  body.childNodes.forEach(element => {
    if (element.nodeName !== 'TR') {
      return;
    }

    const nameTag = element.childNodes[2].textContent;
    const address = element.childNodes[3].childNodes[0].textContent.trim();
    const note = element.childNodes[3].childNodes[1].textContent.trim();
    const dateCreated = element.childNodes[4].textContent;
    list.push({ address, nameTag, note, dateCreated });
  });

  return list;
};

const notes = getNotes();
console.log(notes);
