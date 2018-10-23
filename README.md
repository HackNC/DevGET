# DevGET

GETS submission data from [Devpost](https://devpost.com) Hackathons and generates CSVs for judging teams based on prize categories.

This is necessary because Devpost doesn't provide an API. We _may_ have manually
scraped the data to provide it for our judges in previous years....

# Usage

Log in to Devpost, after installing the extension. Go to Account -> Manage Hackathons -> Submissions. Once you're on the submissions page, click the DevGET button. The results from the scraping should be in the console. (Soon to be downloadable and normalized in CSV files)

# Installation

1. Clone the repo

2. Peruse Chrome's extension [getting started tutorial](https://developer.chrome.com/extensions/getstarted) at your leisure
  * We will walk through the gist of it in the following steps

3. In Chrome, go to `chrome://extensions`

4. Toggle the `Developer Mode` switch on the page

5. Click `LOAD UNPACKED`

6. Select the directory of this repo that you cloned earlier

# Contribution

`get_submission_data.js` contains the code for parsing the Devpost page and
downloading the subsequent html pages specific for each submission. It formats
this data into an array of submissions and prizes for each submission.

`popup.js` handles the extension's button in the toolbar and executing
`get_submission_data.js` once the button is clicked, and logging the results to the
console.

`popup.html` specifies the button and it's design.
