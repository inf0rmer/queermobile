$(document).bind('pageshow', function() {
	console.log($.mobile.activePage);
});

function EventDetails(eventID) {
	this.init(eventID);
}

EventDetails.prototype.init = function(eventID) {
	console.log(eventID);
}