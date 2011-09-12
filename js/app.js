$(function() {	
	$.mobile.ajaxEnabled = false;
	$.mobile.hashListeningEnabled = false;
	
	//Define App namespace
	window.App = {};
		
	//Define Models
	App.Event = Backbone.Model.extend({
		
		defaults : function() {
			return {
				title: 'Evento'
			}
		},
		
		url: 'programme/jsonp/get',
		
		urlRoot: 'http://queerlisboa.pt/api',
		
		setTitle : function(newTitle) {
			this.save({
				title: newTitle
			});
		}
		
	});
	
	App.Date = Backbone.Model.extend({
		
		defaults: function() {
			var now = new Date();
			
			return {
				date: now,
				selected: false
			}
		},
		
		select: function() {
			//Deselect all others
			App.Dates.each(function(date){
				date.set({selected: false});
			});
			
			this.set({selected: true});
		}
		
	});
	
	//Define Collections
	App.EventList = Backbone.Collection.extend({
		
		model: App.Event,
		
		url: 'http://queerlisboa.pt/api/programme/jsonp/get/',
		
		parse : function(resp) {
			var nodeArray = [];	
			_.each(resp.nodes, function(obj){
				nodeArray.push(obj.node);
			});
			
			return nodeArray;
		}
	});	
	App.Events = new App.EventList;
	
	App.DateList = Backbone.Collection.extend({

		model: App.Date,
		
		url: 'http://queerlisboa.pt/api/dates/jsonp/get/',
		
		parse : function(resp) {
			var dateArray = [],
			selected = false;
			
			_.each(resp.dates, function(obj){
				selected = dateObj == new Date();
				
				var dateObj = new Date(obj.date.value),
				formattedObj = {
					date: dateObj,
					selected: selected
				}
				dateArray.push(formattedObj);
			});
			
			if (!selected) dateArray[0].selected = true;
			
			return dateArray;
		},
		
		getSelected: function() {
			var selectedDate;
			this.each(function(date){
				if (date.get('selected')) selectedDate = date;
			});
			
			return selectedDate;
		},
		
		getSelectedAsURL : function() {
			var obj = this.getSelected(),
			date = new Date(obj.get('date'));
			
			return date.strftime('%Y-%m-%d');
		}		
	});
	App.Dates = new App.DateList;
	
	//Define Views
	App.EventView = Backbone.View.extend({
		
		tagName: 'li',
		
		className: 'ui-btn ui-btn-up-c ui-btn-icon-right ui-li',
		
		template: Handlebars.compile('<div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="#/events/{{id}}" data-eventID="{{id}}" class="ui-link-inherit">{{title}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div>'),
		
		events: {
			'click a': 'showEvent'
		},
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},

		render: function() {
			var model = this.model.toJSON(),
			result;
			
			result = this.template(model);
			$(this.el).attr('data-theme', 'c').html(result);
			return this;
		},
		setTitle: function() {
			var title = this.model.get('title');
			$(this.el).text(title);
		},
		
		remove: function() {
			$(this.el).remove();
		},
		
		clear: function() {
			this.model.destroy();
		},
		
		showEvent: function() {
			
			//new App.ShowEventView( { model: App.Events.get($(this.el).find('a').attr('data-eventID')) } );
		}
	});
	
	App.DateView = Backbone.View.extend({
		
		tagName: 'option',
		
		initialize: function() {
			_.bindAll(this, 'render');
			//this.model.bind('change', this.render, this);
		},
		
		render: function() {
			var date = this.model.get('date');
			$(this.el).attr('value', date.strftime('%Y/%m/%d')).html(date.strftime('%d/%m/%Y'));
			
			if (this.model.get('selected')) $(this.el).attr('selected', 'selected');
			
			return this;
		}
	});
	
	App.ShowEventView = Backbone.View.extend({
		
		template: Handlebars.compile('<div data-role="header" data-add-back-btn="true"><a href="index.html" data-rel="back" data-icon="back">Back</a><h1>{{title}}</h1></div><div data-role="content"><dl><dt>Date:</dt><dd><time>{{date}}</time></dd>{{#if note}}<dt>Notes:</dt><dd>{{note}}</dd>{{/if}}</dl></div>'),
		
		initialize: function(u, options) {
			if (u && options) this.render(u, options);
		},
		
		render: function(urlObj, options) {		
			// get the event
			var eventID = urlObj.hash.substr(7),
				event = App.Events.get(eventID),
				modelData = event.toJSON(),
				firstLoad = false;
			
			if (modelData.type = "Film") {
				
			}
			
			if (!$('#event-page-' + modelData.id).length) {
				$('body').append('<div id="event-page-' + modelData.id +'" data-role="page" data-theme="c"></div>');
				firstLoad = true;
			}
						
			$('#event-page-' + modelData.id).html(this.template(modelData));
			
			$('#event-page-' + modelData.id).page();
			
			options.dataUrl = urlObj.href;
			
			$.mobile.changePage($('#event-page-' + modelData.id), options);
		}
	});
	
	//Define the top-level App Views
	App.EventListView = Backbone.View.extend({
		
		el: $('#programmeList'),
		
		events: {
		
		},
		
		initialize: function() {
			_.bindAll(this,'addOne','render');
			App.Events.bind('reset', this.render);
			App.Events.bind('add', this.addOne);
		},
		
		refresh: function() {
			//Fetch programme now
			App.Events.fetch({
				dataType: 'jsonp',
				url: App.Events.url + App.Dates.getSelectedAsURL()
			});
		},
		
		render: function() {
			var $el = $(this.el),
			renderDivider = function(obj) {
				var template = Handlebars.compile('<li data-dividerID="{{hour}}" data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-btn ui-bar-a">{{hour}}</li>');
				
				return template(obj);
			}
			
			$el.empty();
			App.Events.each(function(event) {
				var view = new App.EventView({model: event}),
				previousEvent = App.Events.at(App.Events.indexOf(event) - 1);
				
				if (!previousEvent || (previousEvent && previousEvent.get('hour') != event.get('hour'))) {
					$el.append(renderDivider({
						hour: event.get('hour')
					}));
				}
				
				$el.append(view.render().el);
				
				App.createPage('event-' + event.get('id'));
			});
		},
		
		addOne: function(event) {
			var view = new App.EventView( {model: event} );
			$(this.el).append(view.render().el);
		},
		
		addAll: function() {
			App.Events.each(this.addOne);
		}
	});
	
	App.DateListView = Backbone.View.extend({
		
		el: $('#dateSelect'),
		
		events: {
			'change': 'changeSelected'
		},
		
		initialize: function() {
			var that = this;
			_.bindAll(this,'addOne','render');
			App.Dates.bind('reset', this.render);
			App.Dates.bind('add', this.addOne);
			
			App.Dates.fetch({dataType: 'jsonp', success: function(){
				
				//Fetch programme now
				App.Views.EventList.refresh();
				
				that.render();
			}});
		},
		
		render: function() {
			var $el = $(this.el);
			$el.empty();
			App.Dates.each(function(date) {
				var view = new App.DateView({model: date});
				$el.append(view.render().el);
			});
			
			//jqmobile
			$el.selectmenu('refresh', true);
		},
		
		addOne: function(event) {
			var view = new App.DateView( {model: event} );
			$(this.el).append(view.render().el);
		},
		
		addAll: function() {
			App.Dates.each(this.addOne);
		},
		
		changeSelected: function() {
			var selected = $(this.el).val();
			App.Dates.each(function(element){
				var date = element.get('date');
				if (selected == date.strftime('%Y/%m/%d')) element.select();
			});
			
			App.Views.EventList.refresh();
		}
	});
	
	// Define Routes
	App.Workspace = Backbone.Router.extend({
		
		routes: {
			'/events/:id'	: 'showEvent',
			'*actions'		: 'defaultRoute'
		},
		
		defaultRoute: function() {
			console.log('default route');
		},
		
		home: function() {
			console.log('home');
			//jqmobile
			$.mobile.changePage($('#home'));
		},
		
		showEvent: function(id) {
			console.log('showing event with id ' + id);
		}
		
	});
	
	// Utilities
	App.createPage = function(href) {
		$("<div data-theme='c' data-url='" + href.replace('#', '') +"' data-role='page' id='" + href + "'><div data-role='header'><h1>teste</h1></div><div data-role='content'><img src='css/images/ajax-loader.png' /></div></div>").appendTo('body').page();
	}
	
	// Instantiate App
	App.Views = {};
	App.Router = new App.Workspace();
	Backbone.history.start();
	
	App.Views.DateList = new App.DateListView();
	App.Views.EventList = new App.EventListView();
	
	/*
	$(document).bind( "pagebeforechange", function( e, data ) {
		// We only want to handle changepage calls where the caller is
		// asking us to load a page by URL.
		if ( typeof data.toPage === "string" ) {
			// We are being asked to load a page by URL, but we only
			// want to handle URLs that request the data for a specific
			// event.
			var u = $.mobile.path.parseUrl( data.toPage ),
				re = /^#event-/;
			if ( u.hash.search(re) !== -1 ) {
				// We're being asked to display the items for a specific category.
				// Call our internal method that builds the content for the category
				// on the fly based on our in-memory category data structure.
				//showCategory( u, data.options );
				
				var view = new App.ShowEventView(u, data.options);
	
				// Make sure to tell changepage we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
		}
	});
	*/
});