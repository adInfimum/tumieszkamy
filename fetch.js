function fetchYear(account, year) {
    return fetch(`https://www.strefaklienta24.pl/atrium21/iokRozr/DajDrzewoFinHistoria?Rozr=${account}&DataOd=${year}-01-01&DataDo=${year}-12-31`)
        .then(r => r.ok ? r.json() : Promise.resolve({ ok: false, status: r.status }))
        .then(d => ({ ok: true, status: 200, ...d, year }));
}

function fetchAllYears(account) {
    let data = { account, docs: [] };
    let year = new Date(Date.now()).getFullYear();
    let earliest = year - 1;
    function fetchNext() {
        updateProgress(`Ściąganie danych za rok ${year}!!!`);
        return fetchYear(account, year)
            .then(r => r.ok ? {
                ok: r.ok,
                person: r.data.Osoba,
                title: r.data.Opis,
                minYear: r.data.McNajstarszegoDok ? moment(r.data.McNajstarszegoDok).year() : year,
                docs: getDocs(r.data.Finanse || []),
            } : {
                ok: false,
                minYear: year,
            })
            .then(fetchAllDocs)
            .then(r => {
                if (r.ok) {
                    data.person = r.person;
                    data.title = r.title;
                    data.docs = data.docs.concat(r.docs);
                    --year;
                    return earliest <= year ? fetchNext() : data;
                }
                return data;
            });
    }
    return fetchNext();
}

function getDocs(data) {
    function flatten(e) {
        return [e].concat((e.Pozycje || []).flatMap(flatten));
    }
    return data.flatMap(flatten).flatMap(e => e.Dokument && e.Dokument.Ident ? [e.Dokument] : []);
}

function fetchDoc(id) {
    return fetch(`https://www.strefaklienta24.pl/atrium21/iokRozr/DajDokSzczegoly?Ident=${id}&ACzyDlaMenuWsp=false&ADokDoFakturWsp=false`)
        .then(r => r.ok ? r.json() : Promise.resolve({ ok: false, status: r.status }))
        .then(d => ({ ok: true, status: 200, ...d, id }));
}

function fetchAllDocs(data) {
    //console.log(`Fetching ${data.docs.length} docs from ${data.docs.length > 0 ? data.docs[0].DataDok : ''}`)
    let promises = [];
    for (let d in data.docs) {
        let doc = data.docs[d];
        promises.push(fetchDoc(doc.Ident).then(r => { doc.data = r.data || {} }));
    }
    return Promise.all(promises).then(() => data);
}

function getAccount(url) {
    const accountUrl = /^[^:]*:\/\/(www.)?strefaklienta24.pl\/atrium21\/content\/InetObsKontr\/finanse\/([0-9]+)[\/]?$/i;
    let m = url.match(accountUrl);
    return m ? m[2] : null;
}

function forFilename(name) {
    return name.replaceAll(/[:\/\\]/g, '-');
}

function getUrl() {
    return window.location.href;
}

function getDocUrls(data) {
    const baseUrlPattern = /^[^:]+:\/\/[^\/]+\/atrium21/;
    let baseUrl = getUrl().match(baseUrlPattern)[0];
    return data.docs.flatMap(d => d.data && d.data.SklejoneDok ? d.data.SklejoneDok.map(s => ({
        url: baseUrl + s.Url,
        filename: `${data.account}-${moment(d.DataDok).format('YYYY.MM.DD')}-${forFilename(s.Numer)}.pdf`,
    })) : []);
}

let doFetchInProgress = false;

function updateProgress(text) {
    let button = document.getElementById('invoice-download-button');
    if (button) button.innerText = text || 'Ściągnij wszystkie dokumenty!!!';
}

function writeAll(data) {
    let blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    let url = window.URL.createObjectURL(blob);
    let docs = getDocUrls(data);
    let current = 0, all = docs.length + 1;
    updateProgress(`Ściąganie dokumentów ${current}/${all}...`);
    let port = chrome.runtime.connect({ name: data.account });
    port.onMessage.addListener(msg => {
        console.log('Got fileDownloaded');
        ++current;
        updateProgress(`Ściąganie dokumentów ${current}/${all}...`);
    });
    port.onDisconnect.addListener(msg => {
        window.URL.revokeObjectURL(url);
        updateProgress(`Ściąganie zakończone!!!`);
        doFetchInProgress = false;
    });
    port.postMessage({ msg: 'download', account: data.account, url, docs });
}

function log(o) {
    console.log(o);
    return o;
}

function fetchData(url) {
    let account = getAccount(url);
    if (!account) {
        alert('Nie jesteś na główniej stronie konta');
        return;
    }
    return fetchAllYears(account)
}

function doFetch() {
    if (doFetchInProgress) return;
    doFetchInProgress = true;
    fetchData(getUrl()).then(log).then(writeAll);
}

function addButton(delay) {
    console.log(`adding button ${delay}`)
    if (!getAccount(getUrl()) || delay > 100) return;
    let header = document.getElementsByClassName('header-title');
    if (!header || header.length < 1) setTimeout(() => addButton(delay + 1), 200);

    let button = document.createElement('button');
    button.id = 'invoice-download-button';
    button.onclick = doFetch;
    header[0].appendChild(button);
    updateProgress();
}

function patchLocationChange() {
    history.pushSate = (f => function pushSate() {
        let ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.pushState);
    history.replaceState = (f => function replaceState() {
        let ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    })(history.replaceState);
    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });
}

patchLocationChange();
window.addEventListener('locationchange', () => addButton(0));
addButton(0);
