//Portuguese Date locale
Date.ext.locales['pt-pt'] = {
	a: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
	A: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
	b: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
	B: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
	c: '%a %d %b %Y %T %Z',
	p: ['', ''],
	P: ['', ''],
	x: '%d.%m.%Y',
	X: '%T'
};

// Add2Home config options
window.addToHomeConfig = {
	message		: 'pt_pt',
	animationIn	: 'fade',
	touchIcon 	: true,
	lifespan	: 10000
}

$(document).bind("mobileinit", function(){
	$.mobile.ajaxEnabled = false;
	$.mobile.hashListeningEnabled = false;
});

(function() {
	$('body').removeClass('visuallyhidden').hide().fadeIn('fast');
	//Define App namespace
	window.App = {};
	
	App.reverseTransition = false;
	
	App.cachedViews = {};
		
	//Define Models
	App.Event = Backbone.Model.extend({
		
		defaults : function() {
			return {
				title: 'Evento',
				type: 'Film'
			}
		},
		
		urlRoot: "http://queerlisboa.pt/api/events/jsonp/get/",
		
		setTitle : function(newTitle) {
			this.save({
				title: newTitle
			});
		},
		
		parse : function(resp) {
			var nodeArray = [];	
			_.each(resp.nodes, function(obj){
				nodeArray.push(obj.node);
			});
			return nodeArray[0];
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
	
	App.Film = Backbone.Model.extend({
		
		defaults: function() {
			return {
				title: 'A Film',
				trailer: '',
				poster: ''
			}
		},
		
		parse : function(resp) {
			var nodeArray = [];	
			_.each(resp.nodes, function(obj){
				nodeArray.push(obj.node);
			});
			
			return nodeArray[0];
		}
		
	});
	
	//Define Collections
	App.FilmList = Backbone.Collection.extend({

		model: App.Film,
		
		url: function() {
			var ids = this.pluck('id');
			
			_.each(ids, function(item, index) {
				ids[index] = item.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			});
			
			ids = ids.join(',');
			
			return 'http://queerlisboa.pt/api/films/jsonp/get/' + ids;
		},
		
		parse : function(resp) {
			var nodeArray = [];	
			_.each(resp.nodes, function(obj){
				nodeArray.push(obj.node);
			});
			
			return nodeArray;
		}
		
	});
	
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
	
	App.MyEventList = Backbone.Collection.extend({
		
		model: App.Event,
		
		localStorage: new Store('events'),
		
		comparator: function(event) {
			return event.get('date');
		}
	
	});
	App.MyEvents = new App.MyEventList;
	
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
			date.locale = 'pt-pt';
			
			return date.strftime('%Y-%m-%d');
		}		
	});
	App.Dates = new App.DateList;
	
	//Define Views	
	App.FilmView = Backbone.View.extend({
		tagName: 'article',
		
		template: Handlebars.compile('<li><article><h3><span>Synopsis</span></h3><img src="{{poster}}" /><p class="meta">By {{directors}} / {{length}} / {{runtime}} min.</p><p class="description">{{description}}</p>{{#if videoID}}<h3><span>Trailer</span></h3><iframe class="youtube-video" type="text/html" src="http://www.youtube.com/embed/{{videoID}}" frameborder="0"></iframe>{{/if}}</p></article></li>'),
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},
		
		render: function() {
			var model = this.model.toJSON(),
			result,
			matches = model.trailer.match(/youtube\.com\/watch\?v=([a-z0-9\-_]+)/i);
			
			model.videoID = matches[1];
			
			result = this.template(model);
			$(this.el).attr('data-theme', 'c').html(result);
			
			//$('.youtube-video').fitVids();
			
			return this;
		}
	});
	
	App.MultiFilmView = Backbone.View.extend({
		tagName: 'article',
		
		template: Handlebars.compile('<li><article><h3><span>{{title}}</span></h3><h4><span>Sinopse</span></h4><img src="{{poster}}" /><p class="meta">By {{directors}} / {{length}} / {{runtime}} min.</p><p class="description">{{description}}</p>{{#if videoID}}<h4><span>Trailer</span></h4><iframe class="youtube-video" type="text/html" src="http://www.youtube.com/embed/{{videoID}}" frameborder="0"></iframe>{{/if}}</p></article></li>'),
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},
		
		render: function() {
			var model = this.model.toJSON(),
			result,
			matches = model.trailer.match(/youtube\.com\/watch\?v=([a-z0-9\-_]+)/i);
			
			if (model.trailer != '') model.videoID = matches[1];
			
			result = this.template(model);
			$(this.el).attr('data-theme', 'c').html(result);
			
			//$('.youtube-video').fitVids();
			
			return this;
		}
	});
	
	App.EventView = Backbone.View.extend({
		
		tagName: 'li',
		
		className: 'ui-btn ui-btn-up-c ui-btn-icon-right ui-li',
		
		template: Handlebars.compile('<div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="#/events/{{id}}" data-eventID="{{id}}" class="ui-link-inherit">{{title}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div>'),
		
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
		}
	});
	
	App.DateView = Backbone.View.extend({
		
		tagName: 'li',
		
	className: 'ui-btn ui-btn-up-c ui-btn-icon-right ui-li',
		
		template: Handlebars.compile('<div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="#/dates/{{linkDate}}" class="ui-link-inherit">{{titleDate}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div>'),
		
		initialize: function() {
			_.bindAll(this, 'render');
		},
		
		render: function() {			
			var model = this.model.toJSON(),
			result;
			
			model.date.locale = 'pt-pt';
			
			model.linkDate = model.date.strftime('%Y-%m-%d');
			model.titleDate = model.date.strftime('%A, %d %B');
			
			result = this.template(model);
			$(this.el).attr('data-theme', 'c').html(result);
			return this;
		}
	});
	
	App.ShowEventView = Backbone.View.extend({
		
		template: Handlebars.compile('<div data-role="header" data-add-back-btn="true"><a data-rel="back" class="nav-button" data-icon="back" data-theme="a" data-iconpos="notext" data-direction="reverse"></a><h1>{{title}}</h1><a href="#" class="addToMyList" data-iconpos="notext" data-icon="add"></a></div><div data-role="content"><dl><dt class="date"><span>Data</span></dt><dd><time>{{prettyDate}}</time><dt><span>Local</span></dt><dd>{{prettyVenue}}</dd></dd>{{#if note}}<dt><span>Mais informação</span></dt><dd>{{note}}</dd>{{/if}}</dl></div>'),
		
		events: {
			'click .addToMyList' 		: 'addToMyList',
			'click .removeFromMyList' 	: 'removeFromMyList'
		},
		
		addToMyList: function() {
			if (!App.MyEvents.get(this.model.id)) App.MyEvents.create(this.model.toJSON());
			
			this.disableAddButton();
			return false;
		},
		
		removeFromMyList: function() {
			if (App.MyEvents.get(this.model.id)) {
				App.MyEvents.get(this.model.id).destroy();
			}
			
			this.enableAddButton();
			return false;
		},
		
		initialize: function() {
			this.render();
		},
		
		disableAddButton: function() {
			$(this.el).find('.addToMyList').attr('data-icon', 'minus').removeClass('addToMyList').addClass('removeFromMyList').find('span.ui-icon').addClass("ui-icon-minus").removeClass("ui-icon-plus");
		},
		
		enableAddButton: function() {
			$(this.el).find('.removeFromMyList').attr('data-icon', 'add').removeClass('removeFromMyList').addClass('addToMyList').find('span.ui-icon').addClass("ui-icon-plus").removeClass("ui-icon-minus");
		},
		
		render: function() {
			var that = this,
				relatedFilms,
				filmCollection,
				filmsArray = [],
				filmView,
				modelData = this.model.toJSON(),
				date;
			
			$(this.el)
			.addClass('event-page')
			.attr('id', 'event-' + that.model.id)
			.attr('data-theme', 'c')
			.attr('data-role', 'page')
			
			modelData.date = modelData.date.substr(0, modelData.date.indexOf(' '));
			
			date = new Date(Date.parse(modelData.date));
			
			date.locale = 'pt-pt';
			
			modelData.prettyDate = date.strftime('%A, %d %B - %H:%M');
			
			modelData.prettyVenue = modelData.venue.main;
			
			if (modelData.venue.sub && modelData.venue.sub != null) modelData.prettyVenue += ' - ' + modelData.venue.sub;
			
			if (!App.isPageRendered('event-' + this.model.id)) {
				$(this.el).append(this.template(modelData));
				$('body').append(this.el);
			}
			
			if (App.MyEvents.get(this.model.id)) this.disableAddButton();
			
			$('div[data-role="page"]').page();
			
			$.mobile.changePage($('#event-' + this.model.id), {changeHash: false, transition: App.transition || 'slide', reverse: App.reverseTransition});
			
			// Get related films
			if (this.model.get('type').toLowerCase() == 'film') {				
				relatedFilms = this.model.get('related').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				relatedFilms = relatedFilms.split(',');
				
				filmCollection = new App.FilmList;
				
				filmView = (relatedFilms.length > 1) ? App.MultiFilmView : App.FilmView;
				
				if (!App.isPageRendered('event-' + this.model.id)) $($.mobile.activePage).find('[data-role="content"]').append('<ul class="related-films" data-role="listview" data-theme="c"></ul>');
				
				//if (!App.isPageRendered('event-' + this.model.id) && relatedFilms.length > 1) $($.mobile.activePage).find('.related-films').before('<h3>Filmes</h2>');
				
				if (!App.isPageRendered('event-' + this.model.id)) {
					_.each(relatedFilms, function(item) {
						filmsArray.push({id: item});
					});
					
					filmCollection.add(filmsArray);
					filmCollection.fetch({dataType: 'jsonp', success: function() {
						filmCollection.each(function(film) {
							var view = new filmView( {model: film} );
							$($.mobile.activePage).find('.related-films').append(view.render().el);
						});
					}});
				}
			}
			
			App.renderedPages.push('event-' + this.model.id);
			
			return this;
		}
	});
	
	
	App.EventListView = Backbone.View.extend({
		
		el: $('#programmeList'),

		initialize: function(date) {
			var that = this;
			
			that.date = date.replace(/-/g, '/');
			
			_.bindAll(this,'addOne','render');
			App.Events.bind('reset', this.render);
			App.Events.bind('add', this.addOne);
			
			$(this.el).empty();
			
			App.Events.fetch({
				dataType: 'jsonp',
				url: App.Events.url + date
			});
		},
		
		render: function() {
			var $el = $(this.el),
			renderDivider = function(obj) {
				var template = Handlebars.compile('<li data-dividerID="{{hour}}" data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-btn ui-bar-a">{{hour}}</li>');
				
				return template(obj);
			},
			date = new Date(this.date);
			
			date.locale = 'pt-pt';
			
			$(this.el).empty();
			
			$('#showDate').find('[data-role="header"] h1').text(date.strftime('%a, %d %b'));
			
			App.Events.each(function(event) {
				var view = new App.EventView({model: event}),
				previousEvent = App.Events.at(App.Events.indexOf(event) - 1);
				
				if (!previousEvent || (previousEvent && previousEvent.get('hour') != event.get('hour'))) {
					$el.append(renderDivider({
						hour: event.get('hour')
					}));
				}
				
				$el.append(view.render().el);
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
	
	App.MyEventListView = Backbone.View.extend({
		
		el: $('#myEventsList'),

		initialize: function() {
			var that = this;
			
			_.bindAll(this,'addOne','render');
			App.MyEvents.bind('reset', this.render);
			App.MyEvents.bind('add', this.addOne);
			
			App.MyEvents.fetch();
		},
		
		render: function() {
			var $el = $(this.el),
			renderDivider = function(obj) {
				var template = Handlebars.compile('<li data-dividerID="{{hour}}" data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-btn ui-bar-a">{{date}} - {{hour}}</li>');
				
				return template(obj);
			};
			
			$(this.el).empty();
			
			App.MyEvents.each(function(event) {
				var view = new App.EventView({model: event}),
				previousEvent = App.MyEvents.at(App.Events.indexOf(event) - 1),
				date = event.get('date').substr(0, event.get('date').indexOf(' '));
				
				date = new Date(Date.parse(date));
				
				if (!previousEvent || (previousEvent && previousEvent.get('hour') != event.get('hour'))) {
					$el.append(renderDivider({
						hour: event.get('hour'),
						date: date.strftime('%a, %d %b')
					}));
				}
				
				$el.append(view.render().el);
			});
		},
		
		addOne: function(event) {
			var view = new App.EventView( {model: event} );
			$(this.el).append(view.render().el);
		},
		
		addAll: function() {
			App.MyEvents.each(this.addOne);
		}
	});
	
	App.DateListView = Backbone.View.extend({
		
		el: $('#dateList'),
		
		events: {
			//'change': 'changeSelected'
		},
		
		initialize: function() {
			var that = this;
			_.bindAll(this,'addOne','render');
			App.Dates.bind('reset', this.render);
			App.Dates.bind('add', this.addOne);
			
			App.Dates.fetch({dataType: 'jsonp'});
		},
		
		render: function() {
			var $el = $(this.el);
			$el.empty();
			
			this.addAll();
			
			//App.reapplyStyles($(this.el));
		},
		
		addOne: function(event) {
			var view = new App.DateView( {model: event} );
			$(this.el).append(view.render().el);
		},
		
		addAll: function() {
			App.Dates.each(this.addOne);
		}
	});
	
	
	
	// Utilities
	App.renderedPages = [];
	App.isPageRendered = function(page) {
		if (_.indexOf(App.renderedPages, page) != -1) {
			return true;
		} else {
			return false;
		}
	}
	
	App.reapplyStyles = function($el) {
		//$el.find('ul[data-role]').listview();
	   // $el.find('div[data-role="fieldcontain"]').fieldcontain();
    	$el.find('button[data-role="button"]').button();
	    //$el.find('input,textarea').textinput();
    	$el.page();
	}
	
	// Instantiate App
	App.Views = {};
	
	// Define Routes
	App.Workspace = Backbone.Router.extend({
		
		routes: {
			'/dates'		: 'showDatesPage',
			'/dates/:date'	: 'showDate',
			'/events/:id'	: 'showEvent',
			'/myagenda'		: 'showMyEvents',			
			'*actions'		: 'showDatesPage'
		},
		
		home: function() {			
			App.reapplyStyles($('#home'));
			$.mobile.changePage($('#home'), {changeHash: false, reverse: App.reverseTransition});
			
			App.reverseTransition = false;
		},
		
		showMyEvents: function() {
			var view = App.cachedViews['showMyEvents'] || new App.MyEventListView;
			
			App.cachedViews['showMyEvents'] = view;
			
			App.reapplyStyles($('#myAgenda'));
			$.mobile.changePage($('#myAgenda'), {changeHash: false, transition: 'slideup', reverse: App.reverseTransition});
			
			//App.transition = 'slideup';
			App.reverseTransition = true;
		},
		
		showDatesPage: function() {
			var view = App.cachedViews['dateList'] || new App.DateListView,
			transition = App.transition || 'slide';
			
			App.cachedViews['dateList'] = view;
			
			App.reapplyStyles($('#dateSelection'));
			$.mobile.changePage($('#dateSelection'), {changeHash: false, transition: transition, reverse: App.reverseTransition});
			
			//App.transition = 'slide';
			App.reverseTransition = false;
		},
		
		showDate: function(date) {	
			var view = App.cachedViews['eventListView-' + date] || new App.EventListView(date),
			transition = App.transition || 'slide';
			
			App.cachedViews['eventListView-' + date] = view;
			
			App.reapplyStyles($('#showDate'));
			$.mobile.changePage($('#showDate'), {changeHash: false, transition: transition, reverse: App.reverseTransition});
			
			//App.transition = 'slide';
			App.reverseTransition = false;
		},
		
		showEvent: function(id) {
			var event = App.Events.get(id);
			
			//App.transition = 'slide';
			
			if (!event) {
				event = new App.Event({id : id});
				
				event.fetch({dataType: 'jsonp', success: function() {
					new App.ShowEventView({model: event});
				}});
			} else {
				new App.ShowEventView({model: event});
			}
		}
		
	});
	
	App.Router = new App.Workspace;
	
	App.MyEvents.fetch();
})();

$(function() {
	setTimeout(function() {
		Backbone.history.start();
	}, 200);
	
	$('[data-rel="back"], .back').live('click', function() {
		App.reverseTransition = true;
	});
	
	$('.nav-button').live('click', function() {
		
		App.transition = $(this).attr('data-transition') || 'slide';
		App.reverseTransition = ($(this).attr('data-direction') == 'reverse');
		
	});
	
	$(window).resize(function() {
      var newHeight = $(window).width()*9/16,
      oldHeight = $('div.youTubePlayer:first').attr("height");
      
      if (newHeight > 500)
          newHeight = 500;
      if (newHeight = oldHeight)
          return;
      $('.youtube-video').attr("height", newHeight);
    });    
});