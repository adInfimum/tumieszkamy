let monitoredFileIds = new Map();

function updateProgress(tabId) {
    return fileId => {
        monitoredFileIds.set(fileId, tabId);
    }
}

function downloadFull(url, account, tabId) {
    chrome.downloads.download({
        url,
        filename: `${account}-full.json`,
    }, updateProgress(tabId));
}

function downloadDocs(docs, tabId) {
    for(let i in docs) {
        chrome.downloads.download(docs[i], updateProgress(tabId));
    }
}

function downloadAll(msg, tabId) {
    downloadFull(msg.url, msg.account, tabId);
    downloadDocs(msg.docs, tabId);
}

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['invoke.js']
    });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
    switch(msg.msg) {
        case 'download':
            downloadAll(msg, sender.tab.id);
            break;
    }
});

chrome.downloads.onChanged.addListener(delta => {
    if(monitoredFileIds.has(delta.id) && delta.endTime) {
        console.log('Sending fileDownloaded');
        chrome.tabs.sendMessage(monitoredFileIds.get(delta.id), {msg: 'fileDownloaded', fileId: delta.id});
        //monitoredFileIds.delete(delta.id);
    }
});