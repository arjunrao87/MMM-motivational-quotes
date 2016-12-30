/* Magic Mirror Module: MMM-motivational-quotes
 *
 * By arjunrao87
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");

var validUrl = require("valid-url");
var Fetcher = require("./quotes-fetcher.js");

module.exports = NodeHelper.create({

	// Subclass start method.
	start: function() {
		console.log("Starting module: " + this.name);
		this.fetchers = [];
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
    // Received a notification to add a quotes feed
		if (notification === "ADD_FEED") {
			this.createFetcher(payload.feed, payload.config);
			return;
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reoses the existing one.
	 *
	 * attribute url string - URL of the quotes feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */

	createFetcher: function(feed, config) {

    // Parse the arguments
		var self = this;
		var url = feed.url || "";
		var encoding = feed.encoding || "UTF-8";
		var reloadInterval = config.reloadInterval || 5 * 60 * 1000;
    var type = config.type;
    var showAuthor = config.showAuthor;
    var params = config.parameters;

    // Simple debugging/logging
    console.log( "Received request with following parameters :  " );
    console.log( "URL = " + url + ", params = " + params + ", reloadInterval = " + reloadInterval + ", Request Type = " + type + ", showAuthor = " + showAuthor );

    // Check for valid Quotes API URL
		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", url);
			return;
		}

    // Create a new fetcher
		var fetcher;
		if (typeof self.fetchers[url] === "undefined") {
			console.log("Creating new fetcher for url: " + url + " - Interval: " + reloadInterval);
			fetcher = new Fetcher(url, params, reloadInterval, encoding, type, showAuthor);

			fetcher.onReceive(function(fetcher) {
				self.broadcastFeeds();
			});

			fetcher.onError(function(fetcher, error) {
				self.sendSocketNotification("FETCH_ERROR", {
					url: fetcher.url(),
					error: error
				});
			});

			self.fetchers[url] = fetcher;
		}
    // Use existing fetcher
    else {
			console.log("Use existing fetcher for url: " + url);
			fetcher = self.fetchers[url];
			fetcher.setReloadInterval(reloadInterval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	/* broadcastFeeds()
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */
	broadcastFeeds: function() {
		var feeds = {};
		for (var f in this.fetchers) {
			feeds[f] = this.fetchers[f].items();
		}
		this.sendSocketNotification("QUOTES", feeds);
	}
});
