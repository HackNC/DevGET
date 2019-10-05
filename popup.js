let sendMessagePromise = function(request, callback) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(request, res => {
            callback(res);
            resolve();
        });
    });
};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}



let contentDiv = document.getElementById("content");
let generateBtn = document.getElementById("gencsvs");
let loadingDiv = document.createElement("div");
let loading = document.createElement("p");
loading.innerText = "Loading...";
loadingDiv.appendChild(loading);

let getSpreadsheets = function(results) {
    let csvContent = "data:text/csv;charset=utf-8,";

    for (let i = 0 ; i < results.length ; i++) {
        let escapedTitle = results[i]['title']
            .replace(/"/g, "\\\"");
        let row = `${i}, "${escapedTitle}"`;
        csvContent += row + "\r\n";
    }

    let encodedURI = encodeURI(csvContent);
    let p = document.createElement("p");
    let link = document.createElement("a");
    link.setAttribute("href", encodedURI);
    link.setAttribute("download", "table_numbers.csv");
    link.setAttribute("class", ['download-links'])
    link.innerText = "table_numbers.csv";
    p.appendChild(link);
    contentDiv.appendChild(p);
};

let getPrizeCsvs = function(results) {
    let prizeParticipants = {};

    for (let i = 0 ; i < results.length ; i++) {
        let project = results[i]['title'];
        let prizes = results[i]['prizes'];
        prizes.forEach(function(prize) {
            if (!(prize in prizeParticipants)) {
                prizeParticipants[prize] = "data:text/csv;charset=utf-8,";
            }
            prizeParticipants[prize] += `${i}, ${project}\r\n`;
        });
    }

    for (let prize in prizeParticipants) {
        if (prize) {
            let encodedURI = encodeURI(prizeParticipants[prize]);
            let p = document.createElement("p");
            let link = document.createElement("a");
            link.setAttribute("href", encodedURI);
            link.setAttribute("download", prize + ".csv");
            link.setAttribute("class", ['download-links'])
            link.innerText = prize + ".csv";
            p.appendChild(link);
            contentDiv.appendChild(p);
        }
    }
};

let downloadAllCsvs = function(results) {
    let downloadable_links = document.getElementsByClassName("download-links");
    for (let i = 0 ; i < downloadable_links.length ; i++) {
        downloadable_links[i].click();
    }
}

let finished = false;

let checkFinished = isFinished => {
    if (isFinished) {
        finished = isFinished
    }
    else {
        sleep(500).then(() => {
        chrome.runtime.sendMessage(
            {contentScriptQuery : 'isFinished'},
            checkFinished
        )});
    }
};

let sleepUntilFinished = (callback) => {
    if (finished) {
        callback();
    }
    else {
        sleep(500).then(() => sleepUntilFinished(callback));
    }
}

let genCsv = () => {
    chrome.runtime.sendMessage({contentScriptQuery: 'getSubmissions'},
    result => {
        console.log("HOME STRETCH");
        console.log(result);
        loadingDiv.remove();
        getSpreadsheets(result);
        getPrizeCsvs(result);

        let btn = document.createElement("button");
        btn.onclick = downloadAllCsvs;
        btn.innerText = "Download All CSVs";
        contentDiv.appendChild(btn);
    });
}
                        
generateBtn.onclick = function(element) {
    chrome.runtime.sendMessage({contentScriptQuery : 'reset'},
    () => {
        console.log("RESETED");
        contentDiv.appendChild(loadingDiv);
        chrome.tabs.query(
            {active: true, currentWindow: true},
            function(tabs) {
                chrome.tabs.executeScript(
                    tabs[0].id,
                    {file: "get_submission_data.js"},
                    r => {
                        // will run until the thing is finished
                        chrome.runtime.sendMessage(
                            {contentScriptQuery : 'isFinished'},
                            checkFinished);

                        sleep(500).then(() => sleepUntilFinished(genCsv));
                    }
                )
            }
        );
    });
};
