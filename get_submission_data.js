// block scoping!!! fuck js
{
    // Since document is a global singleton, you cannot run `DOMElt.getElementById`,
    // this makes querying other xhr-requested pages difficult. Thus they can use
    // this helper function instead (which travses the DOM tree.. so it's a little
    // bit unoptimized)
    // NOTE: domElt must be a domElt, i.e., don't use this on `document`, instead,
    // do
    // getEltById(document.documentElement, id)
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

    let getPrizes = function(divs) {
        for (let i = 0 ; i < divs.length ; i++) {
            if (divs[i].getAttribute('id') == 'opt_in_prizes') {
                return divs[i];
            }
        }

        return null;
    }

    let getPrizeList = function(text) {
        let prizes = text.split(":")[1].trim().split(",").map(function(str) {
            return str.trim();
        });
        return prizes;
    }

    // dev post is ultimately paginated... so we have to scrap page by page
    let getSubmissionInfoOfPage = function(page) {
        let table = 
            getEltById(page, 'moderate-submissions')
            .getElementsByTagName("tbody")[0]; 

        let submissions = [];

        for (let i = 1, row ; row = table.rows[i] ; i++) { 
            let submission = row.cells[2].getElementsByTagName("div")[0]; 
            let title = submission.getElementsByTagName("p")[0].innerText;
            let projectLink =
                submission
                .getElementsByTagName("p")[0]
                .getElementsByTagName("a")[0].href;

            let request = new XMLHttpRequest();
            // we set async to false, just because performance isn't of much
            // importance here...
            request.open("GET", projectLink, false);
            request.send(null);

            let projectPage = document.createElement("html");
            projectPage.innerHTML = request.responseText;
            // this is annoying... turns out you cannot do '.getElementById' on DOM
            // elts
            let prizesText = getEltById(projectPage, 'opt_in_prizes').innerText;

            let prizes = getPrizeList(prizesText);

            submissions.push({"title": title, "prizes": prizes});
        }

        return submissions;
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
    }

    let main = function() {
        let pages = getAllPageElts();

        let submissions = []

        pages.forEach(function (pg) {
            let pgSubmissions = getSubmissionInfoOfPage(pg);
            pgSubmissions.forEach(function(obj) {
                if (obj) {
                    submissions.push(obj)
                }
            });
        });

        return submissions;
    }

    var result = main();

    result
}
