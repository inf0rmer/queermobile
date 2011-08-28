$(document).ready(function(){
	Programme.init();
});

var Programme = new function Programme(override) {
    var instance = this;
    Programme.getInstance = function()
    {
        return instance;
    }

    var settings = {
        endpoint: 'http://queerlisboa.pt/api/programme/jsonp',
        itemTemplate: ' {{#node}} <li data-theme="c" class="ui-btn ui-btn-up-c ui-btn-icon-right ui-li"><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="#event-{{id}}" class="ui-link-inherit">{{title}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div></li> {{/node}} ',
		dividerTemplate: ' {{#dividers}}<li data-dividerID="{{hour}}" data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-btn ui-bar-a">{{hour}}</li>{{/dividers}} '
    }

	
    jQuery.extend(settings, override);

    instance.init = function(){
    	instance.eventBinding();
        instance.request();
        
        instance.init = function() {
        	return instance;
        }
    }

    instance.request = function() {
        $.ajax({
            url: settings.endpoint,
            dataType: 'jsonp',
            success: instance.responseHandler
        })
    }

    instance.responseHandler = function(data) {
		// Create the appropriate dividers
		var dividersObj = { dividers: [] },
			usedHours = [];
		$.each(data.nodes, function(index, element){
			var hour = element.node.hour;
			
			if ($.inArray(hour, usedHours) == -1) {
				dividersObj.dividers.push({ hour: hour });
				usedHours.push(hour);
			}
		});
		
		$('#programmeList').html($.mustache(settings.dividerTemplate, dividersObj));
		
		$.each(data.nodes, function(index, element) {
			$('#programmeList .ui-li-divider[data-dividerID="' + element.node.hour + '"]').after($.mustache(settings.itemTemplate, element));
		});
    }
    
    instance.eventBinding = function() {
    	$('#programmeList').delegate('li.ui-btn', 'tap', instance.loadEvent);
    }
    
    instance.loadEvent = function() {
    	console.log(window.location.hash);
    }
}