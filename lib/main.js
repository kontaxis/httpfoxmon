"use strict";

/*
 * make sure to have extensions.sdk.console.logLevel = "all" in Firefox
 * about:config for console.log() messages to appear
 */

const { Cc, Ci, components } = require("chrome");

var observerService =
  Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

var httpRequestObserver =
{
  observe: function(aSubject, aTopic, aData)
  {
    if (aTopic == "http-on-examine-response") {
      var newListener = new TracingListener();
      aSubject.QueryInterface(Ci.nsITraceableChannel);
      newListener.originalListener = aSubject.setNewListener(newListener);
    }
  },

  QueryInterface: function (aIID)
  {
    if (aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsISupports)) {
      return this;
    }
    throw components.results.NS_NOINTERFACE;
  }
};

function TracingListener() {
  this.originalListener = null;
}

TracingListener.prototype =
{
  bytesAvailable: 0,

  onDataAvailable: function(request, context, inputStream, offset, count)
  {
    this.bytesAvailable += count;
    this.originalListener.onDataAvailable(
      request, context, inputStream, offset, count);
  },

  onStartRequest: function(request, context)
  {
    this.originalListener.onStartRequest(request, context);
  },

  onStopRequest: function(request, context, statusCode)
  {
    request.QueryInterface(components.interfaces.nsIHttpChannel);
    var topDoc = this.getTopDocFromChannel(request);
    var topLocation = topDoc?topDoc.location.href:"NULLDOC";
    console.log(">>> [" + topLocation + "] " + request.URI.spec
      + " STOP " + this.bytesAvailable);

    this.originalListener.onStopRequest(request, context, statusCode);
  },

  QueryInterface: function (aIID) {
    if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
      return this;
    }
    throw components.results.NS_NOINTERFACE;
  },

  /* https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Tabbed_browser#Getting_the_browser_that_fires_the_http-on-modify-request_notification */
  getTopDocFromChannel: function (aChannel)
  {
    try {
      var notificationCallbacks =
        aChannel.notificationCallbacks ? aChannel.notificationCallbacks : ((aChannel.loadGroup) ? aChannel.loadGroup.notificationCallbacks : null);

      if (!notificationCallbacks) {
          return null;
      }

      var domWin = notificationCallbacks.getInterface(components.interfaces.nsIDOMWindow);
      if (domWin && domWin.top && domWin.top.document) {
        return domWin.top.document;
      }
      else {
        return null;
      }
    }
    catch (e) {
      dump(e + "\n");
      return null;
    }
  }
}

/*
 * Called when addon is loaded
 */
function main(options)
{
  observerService.addObserver(httpRequestObserver,
	  "http-on-examine-response", false);
}

exports.main = main;
