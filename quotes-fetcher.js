/* Magic Mirror
 * Quotes Fetcher
 *
 * By arjunrao87
 * MIT Licensed.
 */

var FeedMe = require("feedme");
var request = require("request");
var iconv = require("iconv-lite");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * url  - URL of the quotes feed.
 * reloadInterval  - Reload interval in milliseconds.
 * type : type of request ( GET/POST )
 * showAuthor : Should the author name be displayed

 */

var Fetcher = function(url, params, reloadInterval, encoding, type, showAuthor) {
    var self = this;
    if (reloadInterval < 1000) {
        reloadInterval = 1000;
    }

    var reloadTimer = null;
    var items = [];

    var fetchFailedCallback = function() {};
    var itemsReceivedCallback = function() {};

    /* private methods */

    /* fetchQuotes()
     * Request the new quotes.
     */

    var fetchQuotes = function() {
        clearTimeout(reloadTimer);
        reloadTimer = null;
        items = [];
        request.get(url, function(error, response, body) {
            if (error) {
                console.log("Error encountered in post request " + error);
            }
            if (response.body.error) {
                console.log("Error encountered in post request body" + response.body.error);
            }
            console.log("Body = " + JSON.stringify(body) + ", Response = " + JSON.stringify(response) + ", Error = " + JSON.stringify(error));
            try {
                body = body.replace("\\'", "'");
                var content = JSON.parse(body);
                var quote = content.quoteText;
                var author = content.quoteAuthor;
                var quoteLink = content.quoteLink;
                if (quote) {
                    items.push({
                        quote: quote,
                        author: author,
                        url: quoteLink,
                    });
                    self.broadcastItems();
                    scheduleTimer();
                } else {
                    console.log("Invalid quote received without text.");
                    fetchFailedCallback(self, "Invalid quote received without text.");
                    scheduleTimer();
                }
            } catch (err) {
                console.log("Error while parsing response : " + err);
                fetchFailedCallback(self, "Invalid quote received without text.");
                scheduleTimer();
            }
        });
    };

    /* scheduleTimer()
     * Schedule the timer for the next update.
     */

    var scheduleTimer = function() {
        //console.log('Schedule update timer.');
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(function() {
            fetchQuotes();
        }, reloadInterval);
    };

    /* public methods */

    /* setReloadInterval()
     * Update the reload interval, but only if we need to increase the speed.
     *
     * attribute interval number - Interval for the update in milliseconds.
     */
    this.setReloadInterval = function(interval) {
        if (interval > 1000 && interval < reloadInterval) {
            reloadInterval = interval;
        }
    };

    /* startFetch()
     * Initiate fetchQuotes();
     */
    this.startFetch = function() {
        fetchQuotes();
    };

    /* broadcastItems()
     * Broadcast the existing items.
     */
    this.broadcastItems = function() {
        if (items.length <= 0) {
            //console.log('No items to broadcast yet.');
            return;
        }
        //console.log('Broadcasting ' + items.length + ' items.');
        itemsReceivedCallback(self);
    };

    this.onReceive = function(callback) {
        itemsReceivedCallback = callback;
    };

    this.onError = function(callback) {
        fetchFailedCallback = callback;
    };

    this.url = function() {
        return url + params;
    };

    this.items = function() {
        return items;
    };
};

module.exports = Fetcher;
