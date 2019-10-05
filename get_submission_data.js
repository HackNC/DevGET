// block scoping!!! fuck js
{
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

    let sendMessagePromise = function(request, callback) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(request, res => {
                callback(res);
                resolve();
            });
        });
    };


    // dev post is ultimately paginated... so we have to scrap page by page
    let getSubmissionInfoOfPage = function(page) {
        let table = 
            getEltById(page, 'moderate-submissions')
            .getElementsByTagName("tbody")[0]; 

        var p = Promise.resolve();

        for (let i = 0, row ; row = table.rows[i] ; i++) { 
            p = p.then(() => {
                let submission = row.cells[1].getElementsByTagName("div")[0]; 
                let title = submission.getElementsByTagName("p")[0].innerText;
                let projectLink =
                    submission
                    .getElementsByTagName("p")[0]
                    .getElementsByTagName("a")[0].href;
                console.log(projectLink);
                return sendMessagePromise(
                    {
                        contentScriptQuery: 'fetchSubmissionPage', 
                        title: title,
                        page_url: projectLink
                    },
                    prizeList => {
                        console.log(prizeList);
                    });
            });
        }

        return p;
    }

    let getAllPageElts = function() {
        let paginationArea = document.getElementsByClassName("pagination")[0];
        let otherPagesURLs = new Set([]);
        Array.prototype.forEach.call(paginationArea.children, function (elt) {
            if (elt.getAttribute("href")) {
                otherPagesURLs.add(elt.getAttribute("href"));
            }
        });

        let currentHostname = document.domain;

        let pagesElts = [document.documentElement];

        otherPagesURLs.forEach(function (path) {
            let absPath = "https://" + currentHostname + path;
            let r = new XMLHttpRequest();
            r.open("GET", absPath, false);
            r.send(null);

            let pg = document.createElement("html");
            pg.innerHTML = r.responseText;
            pagesElts.push(pg);
        });

        return pagesElts;
    };

    let main = async function() {
        console.log("ENTERED MAIN");
        let pages = getAllPageElts();

        var p = Promise.resolve();

        pages.forEach(function (pg) {
            p = p.then(() =>
                getSubmissionInfoOfPage(pg)
            );
        });

        p.then(() => 
            chrome.runtime.sendMessage(
                {
                    contentScriptQuery: "finished"
                },
                res => {}
            ));

        return await p;
    };

    (async function() {
        return await main();
    })();
}
