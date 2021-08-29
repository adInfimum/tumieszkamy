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
    for (let doc of data.docs) {
        promises.push(fetchDoc(doc.Ident).then(r => { doc.data = r.data || {} }));
    }
    return Promise.all(promises).then(() => data);
}

function getAccount(url) {
    const accountUrl = /^[^:]*:\/\/(www.)?strefaklienta24.pl\/atrium21\/content\/InetObsKontr\/finanse\/([0-9]+)[\/]?$/i;
    let m = url.match(accountUrl);
    return m ? m[2] : null;
}

function forFilename(account, date, number) {
    return `${account}-${moment(date).format('YYYY.MM.DD')}-${number.replaceAll(/[:\/\\]/g, '-')}.pdf`;
}

function getUrl() {
    return window.location.href;
}

function getDocUrls(data) {
    const baseUrlPattern = /^[^:]+:\/\/[^\/]+\/atrium21/;
    let baseUrl = getUrl().match(baseUrlPattern)[0];
    return data.docs.flatMap(d => d.data && d.data.SklejoneDok ? d.data.SklejoneDok.map(s => ({
        url: baseUrl + s.Url,
        filename: forFilename(data.account, d.DataDok, s.Numer),
    })) : []);
}

let doFetchInProgress = false;

function updateProgress(text) {
    let button = document.getElementById('invoice-download-button');
    if (button) button.innerText = text || 'Ściągnij wszystkie dokumenty!!!';
}

function quote(text) {
    return '"' + text.toString().replaceAll('"', '\'') + '"';
}

function header(headers) {
    return headers.map(quote).join(',');
}

function record(record, headers) {
    let rec = [];
    function toDate(field) {
        return /[0-9-]+T[0-9:+]+/.test(field) ? moment(field).format('YYYY.MM.DD') : field;
    }
    for (let h of headers) rec.push(record[h] ? quote(toDate(record[h])) : '""');
    return rec.join(',');
}

function sortByDate(a, b) {
    return moment(a.DataDok).diff(moment(b.DataDok));
}

function generateDocsCsv(data) {
    let headers = ['RozrId', 'KontoFin', 'DokId', 'Rodzaj', 'Opis', 'DataDok', 'Numer', 'TermPl', 'StrKsg', 'Kwota', 'Pliki'];
    let lines = data.docs
        .map(doc => ({
            ...doc,
            Pliki: (doc.SklejoneDok || []).map(s => forFilename(data.account, doc.DataDok, s.Numer)).join('; '),
        }))
        .sort(sortByDate)
        .map(r => record(r, headers));
    return [header(headers), ...lines].join('\n');
}

function generateLinesCsv(data) {
    let headers = ['RozrId', 'KontoFin', 'DokId', 'Rodzaj', 'DokOpis', 'DataDok', 'Numer', 'TermPl', 'StrKsg', 'Kwota', 'Lokal', 'SkladnikOpl', 'Opis', 'Cena', 'Ilosc', 'Netto', 'Vat', 'Brutto'];
    let lines = data.docs
        .filter(d => d.data.Szczegoly.Pozycje)
        .flatMap(doc => doc.data.Szczegoly.Pozycje.map(p => ({
            ...doc,
            DokOpis: doc.Opis,
            ...p
        })))
        .sort(sortByDate)
        .map(r => record(r, headers));;
    return [header(headers), ...lines].join('\n');
}

function generatePaymentsCsv(data) {
    let headers = ['RozrId', 'KontoFin', 'DokId', 'Rodzaj', 'DokOpis', 'DataDok', 'DokNumer', 'DokTermPl', 'StrKsg', 'DokKwota', 'Numer', 'Opis', 'Kwota', 'KwotaParowania', 'TermPl'];
    let lines = data.docs
        .filter(d => d.data.Szczegoly.Parowania)
        .flatMap(doc => doc.data.Szczegoly.Parowania.map(p => ({
            ...doc,
            DokNumer: doc.Numer,
            DokOpis: doc.Opis,
            DokKwota: doc.Kwota,
            DokTermPl: doc.TermPl,
            ...p
        })))
        .sort(sortByDate)
        .map(r => record(r, headers));
    return [header(headers), ...lines].join('\n');
}

function generateCsv(data) {
    data.docsCsv = generateDocsCsv(data);
    data.linesCsv = generateLinesCsv(data);
    data.paymentsCsv = generatePaymentsCsv(data);
    return data;
}

function getBlobs(data) {
    generateCsv(data);
    let blobs = [];
    blobs.push({
        filename: `${data.account}-full.json`,
        url: window.URL.createObjectURL(new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' })),
    });
    blobs.push({
        filename: `${data.account}-dokumenty.csv`,
        url: window.URL.createObjectURL(new Blob([data.docsCsv], { type: 'text/csv' })),
    });
    blobs.push({
        filename: `${data.account}-linieFaktur.csv`,
        url: window.URL.createObjectURL(new Blob([data.linesCsv], { type: 'text/csv' })),
    });
    blobs.push({
        filename: `${data.account}-ksiegowania.csv`,
        url: window.URL.createObjectURL(new Blob([data.paymentsCsv], { type: 'text/csv' })),
    });
    return blobs;
}

function writeAll(data) {
    generateCsv(data);
    let blobs = getBlobs(data);
    let docs = getDocUrls(data);
    let current = 0, all = docs.length + blobs.length;
    updateProgress(`Ściąganie dokumentów ${current}/${all}...`);
    let port = chrome.runtime.connect({ name: data.account });
    port.onMessage.addListener(msg => {
        console.log('Got fileDownloaded');
        ++current;
        updateProgress(`Ściąganie dokumentów ${current}/${all}...`);
    });
    port.onDisconnect.addListener(msg => {
        blobs.map(b => window.URL.revokeObjectURL(b.url));
        updateProgress(`Ściąganie zakończone!!!`);
        doFetchInProgress = false;
    });
    port.postMessage({ msg: 'download', account: data.account, docs: [...blobs, ...docs] });
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

function addButton() {
    if (!getAccount(getUrl())) return;
    let header = document.getElementsByClassName('header-title');
    if (!header || header.length < 1) return;
    let button = document.createElement('button');
    button.id = 'invoice-download-button';
    button.onclick = doFetch;
    header[0].appendChild(button);
    updateProgress();
}

addButton();
