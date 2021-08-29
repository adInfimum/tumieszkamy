let monitoredFileIds = new Map();

function updateProgress(port) {
    return fileId => {
        monitoredFileIds.set(fileId, port);
    }
}

function downloadFull(url, account, port) {
    chrome.downloads.download({
        url,
        filename: `${account}-full.json`,
    }, updateProgress(port));
}

function downloadDocs(docs, port) {
    for(let i in docs) {
        chrome.downloads.download(docs[i], updateProgress(port));
    }
}

function downloadAll(msg, port) {
    downloadFull(msg.url, msg.account, port);
    downloadDocs(msg.docs, port);
}

function hasMoreFiles(map, port) {
    for(let p of map.values()) {
        if(p.name === port.name) return true;
    }
    return false;
}

chrome.runtime.onConnect.addListener((port) => {
    let tabId = port.sender.tab.id;
    port.onMessage.addListener((msg, msgPort) => downloadAll(msg, msgPort))
});

chrome.downloads.onChanged.addListener(delta => {
    if(monitoredFileIds.has(delta.id) && delta.endTime) {
        let port = monitoredFileIds.get(delta.id);
        monitoredFileIds.delete(delta.id);
        port.postMessage({msg: 'fileDownloaded', fileId: delta.id});
        if(!hasMoreFiles(monitoredFileIds, port)) port.disconnect();
    }
});
