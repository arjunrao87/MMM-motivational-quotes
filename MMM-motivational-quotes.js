Module.register("MMM-motivational-quotes", {

    // Default module config
    defaults: {
        defaultQuote: "If you ain't first, you're last!"
        feeds: [{
            title: "Forismatic",
            shortname: "forismatic",
            url: "http://api.forismatic.com/api/1.0/",
            parameters: "method=getQuote&format=json&lang=en",
            type: "POST",
            encoding: "UTF-8"
        }, ],
        showAuthor: true,
        showFeedName: false,
        reloadInterval: 8 * 60 * 1000, // Every 8 minutes
        updateInterval: 10 * 1000,
        animationSpeed: 2.5 * 1000,
        maxQuotes: 0, // 0 for unlimited
        removeStartTags: "",
        removeEndTags: "",
        startTags: [],
        endTags: []
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    // Define required translations.
    getTranslations: function() {
        return false;
    },

    start: function() {
        Log.info(this.name + ' has started!');

        // Set locale
        this.config.language = config.language;
        moment.locale(config.language);

        // Setup startup parameters
        this.quotes = [];
        this.loaded = false;
        this.activeItem = 0;

        // Register quote feeds
        this.registerFeeds();

        // Send notification
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "QUOTES") {
            this.generateQuotes(payload);
            if (!this.loaded) {
                this.scheduleUpdateInterval();
            }
            this.loaded = true;
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        if (this.config.feedUrl) {
            wrapper.className = "small bright";
            wrapper.innerHTML = "The configuration options for the motivational quotes module have changed.<br>Please check the documentation.";
            return wrapper;
        }
        if (this.activeItem >= this.quotes.length) {
            this.activeItem = 0;
        }
        if (this.quotes.length > 0) {
            if (this.config.showAuthor ) {
                var author = document.createElement("div");
                author.className = "light small dimmed";
                if (this.config.showAuthor) {
                    author.innerHTML = this.quotes[this.activeItem].author;
                }
                wrapper.appendChild(author);
            }
            var quote = document.createElement("div");
            quote.className = "bright medium light";
            quote.innerHTML = this.quotes[this.activeItem].quote;
            wrapper.appendChild(quote);
        } else {
            wrapper.innerHTML = this.config.defaultQuote;
            wrapper.className = "small dimmed";
        }
        return wrapper;
    },

    //----------------- HELPER METHODS --------------//

    registerFeeds: function() {
        for (var f in this.config.feeds) {
            var feed = this.config.feeds[f];
            this.sendSocketNotification("ADD_FEED", {
                feed: feed,
                config: this.config
            });
        }
    },

    /* scheduleUpdateInterval()
     * Schedule visual update.
     */
    scheduleUpdateInterval: function() {
        var self = this;
        self.updateDom(self.config.animationSpeed);
        setInterval(function() {
            self.activeItem++;
            self.updateDom(self.config.animationSpeed);
        }, this.config.updateInterval);
    },

    /**
     * Generate a list of quotes for this configured module
     */
    generateQuotes: function(feeds) {
        var quotes = [];
        for (var feed in feeds) {
            var feedItems = feeds[feed];
            if (this.subscribedToFeed(feed)) {
                for (var i in feedItems) {
                    var item = feedItems[i];
                    item.quoteAuthor = this.authorForQuote(feed);
                    quotes.push(item);
                }
            }
        }
        if (this.config.maxQuotes > 0) {
            quotes = quotes.slice(0, this.config.maxQuotes);
        }
        this.quotes = quotes;
    },


    /* subscribedToFeed(feedUrl)
     * Check if this module is configured to show this feed.
     *
     * attribute feedUrl string - Url of the feed to check.
     *
     * returns bool
     */
    subscribedToFeed: function(feedUrl) {
        for (var f in this.config.feeds) {
            var feed = this.config.feeds[f];
            if (feed.url === feedUrl) {
                return true;
            }
        }
        return false;
    },

    /**
     * Retrieve the name of the author for the quote title
     */
    authorForQuote: function(feedUrl) {
        for (var f in this.config.feeds) {
            var feed = this.config.feeds[f];
            if (feed.url === feedUrl) {
                return feed.quoteAuthor || "";
            }
        }
        return "";
    },
});
