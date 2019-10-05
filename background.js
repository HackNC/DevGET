// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let getEltById = function(domElt, id) {
    if (domElt.getAttribute("id") == id) {
        return domElt;
    }

    if (domElt.children) {
        for (let i = 0 ; i < domElt.children.length ; i++) {
            let res = getEltById(domElt.children[i], id);
            if (res) {
                return res;
            }
        }
    }
    return null;
}

let getPrizeList = function(text) {
    let projectPage = document.createElement("html");
    projectPage.innerHTML = text;

    let prizesText = getEltById(projectPage, 'opt_in_prizes').innerText;

    let prizes = prizesText.split(":")[1].trim().split(",").map(function(str) {
        return str.trim();
    });
    return prizes;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("The color is green.");
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
          conditions: [new chrome.declarativeContent.PageStateMatcher({
              pageUrl: {hostEquals : "manage.devpost.com"},
          })
          ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
  });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.contentScriptQuery == "fetchSubmissionPage") {
            fetch(request.page_url)
                .then(response => response.text())
                .then(text => getPrizeList(text))
                .then(prizeList => {
                    chrome.storage.local.get(['submissions'],
                    result => {
                        result.submissions.push(
                            {
                                title: request.title,
                                prizes: prizeList
                            });
                        console.log(result.submissions);
                        chrome.storage.local.set(
                            {submissions: result.submissions},
                            () => {sendResponse(prizeList);}
                        );
                    });
                })
                .catch(error => console.error(error));
        }
        if (request.contentScriptQuery == "reset") {
            chrome.storage.local.set({submissions: [], finished: false},
                () => {
                    console.log("RESETED!");
                    sendResponse();
                });
        }
        if (request.contentScriptQuery == "getSubmissions") {
            chrome.storage.local.get(['submissions'],
                result => { sendResponse(result.submissions); });
        }
        if (request.contentScriptQuery == "isFinished") {
            chrome.storage.local.get(['finished'],
                result => { sendResponse(result.finished); });
        }
        if (request.contentScriptQuery == "finished") {
            chrome.storage.local.set({finished: true},
            () => {
                console.log("FINISHED");
                sendResponse();
            });
        }
        return true;
    });
