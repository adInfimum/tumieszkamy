function getByContent(text, root) {
    let element = root || document;
    if (element.innerText == text) return element;
    found = null;
    for (let i = 0; !found && i < element.children.length; i++) {
        found = getByContent(text, element.children[i]) || found;
    }
    return found;
}

function enumerateDocs() {
    let docs = [];
    let printButton = document.getElementsByClassName('list-print-btn')
    if (!printButton || printButton.length < 1) return docs;
    printButton[0].click();
    let items = document.getElementsByClassName('docs-to-download-item');
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let title = item.textContent.trim();
        docs.push(title);
        console.log(title);
    }
    return docs;
}

const TIMEOUT = 500;

function expandMonths(callback) {
    let loadMore = getByContent('Pokaż wcześniejsze');
    if(loadMore) {
        loadMore.click();
        setTimeout(() => expandMonths(callback), TIMEOUT);
    } else {
        setTimeout(() => noMoreMonths(callback), TIMEOUT);
    }
}

function noMoreMonths(callback) {
    let loadMore = getByContent('Pokaż wcześniejsze');
    if(loadMore) {
        expandMonths(callback);
    } else {
        if(callback) callback();
    }
}

function enumerateMonths() {
    let docs = [];
    let items = document.getElementsByClassName('list-item');
    for (let j = 0; j < items.length; j++) {
        let item = items[j];
        let date = '', dateNode = getByContent('Data dokumentu:', item);
        if (dateNode) {
            date = dateNode.parentNode.textContent.substring(dateNode.textContent.length).trim();
            date = moment(date, 'DD.MM.YYYY').format('YYYY.MM.DD') + ' - ';
        }
        let title = date + item.getElementsByClassName('header')[0].textContent.trim();
        docs.push(title);
        console.log(title);
    }
    return docs;
}

function enumerateAccounts() {
    let accounts = [];
    let items = document.getElementsByClassName('app-konto-finansowe');
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let title = item.getElementsByClassName('title')[0].textContent;
        accounts.push(title);
        console.log(title);
    }
    return accounts;
}

//alert('fdas');
expandMonths(() => {
    console.log('Accounts: ', enumerateAccounts());
    console.log('Documents: ', enumerateMonths());
    console.log('Documents: ', enumerateDocs());
});
