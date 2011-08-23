$(function(){
	// Request programme
	$.ajax({
		url: 'http://queerlisboa.pt/api/programme/jsonp',
		dataType: 'jsonp',
		success: function(data) {
			console.log(data);
		}
	});
});