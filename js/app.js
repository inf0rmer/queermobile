//Portuguese Date locale
Date.ext.locales['pt-pt'] = {
	a: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
	A: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
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
	$.mobile.loadingMessage = 'A carregar...';	
});

(function() {
	$('body').removeClass('visuallyhidden').hide().fadeIn('fast');
	//Define App namespace
	window.App = {};
	
	App.spinnerOpts = {
		lines: 10, // The number of lines to draw
		length: 7, // The length of each line
	  	width: 2, // The line thickness
	  	radius: 10, // The radius of the inner circle
	  	color: '#777', // #rbg or #rrggbb
	  	speed: 1.6, // Rounds per second
	  	trail: 60, // Afterglow percentage
	  	shadow: false // Whether to render a shadow
	};
	
	App.method = 'jsonp';
	
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
		
		urlRoot: "http://queerlisboa.pt/api/events/" + App.method + "/get/",
		
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
			
			return 'http://queerlisboa.pt/api/films/' + App.method + '/get/' + ids;
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
		
		url: 'http://queerlisboa.pt/api/programme/' + App.method + '/get/',
		
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
		
		url: 'http://queerlisboa.pt/api/dates/' + App.method + '/get/',
		
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
		
		template: Handlebars.compile('<li><article><h3><span>Sinopse</span></h3><img src="{{poster}}" /><p class="meta">By {{directors}} / {{length}} / {{runtime}} min.</p><p class="description">{{description}}</p>{{#if videoID}}<h3><span>Trailer</span></h3><iframe height="' + $(window).width()*9/16 + '" width="100%" class="youtube-video" type="text/html" src="http://www.youtube.com/embed/{{videoID}}" frameborder="0"></iframe>{{/if}}</p></article></li>'),
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},
		
		render: function() {
			var model = this.model.toJSON(),
			result,
			matches = model.trailer.match(/youtube\.com\/watch\?v=([a-z0-9\-_]+)/i);
			
			model.videoID = (matches && matches.length) ? matches[1] : undefined;
			
			result = this.template(model);
			$(this.el).attr('data-theme', 'c').html(result);
			
			//$('.youtube-video').fitVids();
			
			return this;
		}
	});
	
	App.MultiFilmView = Backbone.View.extend({
		tagName: 'article',
		
		template: Handlebars.compile('<li><article><h3><span>{{title}}</span></h3><h4><span>Sinopse</span></h4><img src="{{poster}}" /><p class="meta">By {{directors}} / {{length}} / {{runtime}} min.</p><p class="description">{{description}}</p>{{#if videoID}}<h4><span>Trailer</span></h4><iframe height="' + $(window).width()*9/16 + '" width="100%" class="youtube-video" type="text/html" src="http://www.youtube.com/embed/{{videoID}}" frameborder="0"></iframe>{{/if}}</p></article></li>'),
		
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
		
		className: 'ui-btn ui-btn-up-c ui-btn-icon-right ui-li has-thumb',
		
		template: Handlebars.compile('<div class="ui-btn-inner ui-li"><div class="ui-btn-text"><img src="img/ql-icon-20-{{imageType}}.png" class="ui-li-icon" /> <a href="#/events/{{id}}" data-eventID="{{id}}" class="ui-link-inherit">{{title}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div>'),
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},

		render: function() {
			var model = this.model.toJSON(),
			result;
			
			model.imageType = model.type.toLowerCase().replace(/ /g, '-');
			
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
		
		template: Handlebars.compile('<div data-role="header" data-add-back-btn="true"><a href="#/dates/{{urlDate}}"class="nav-button" data-icon="back" data-theme="a" data-direction="reverse">{{buttonDate}}</a></a><h1>{{title}}</h1><a href="#/myagenda" class="nav-button ui-btn-right" data-iconpos="notext" data-icon="grid" data-theme="a" data-transition="slide"></a></div><div data-role="content"><dl><dt class="date"><span>Data</span></dt><dd><time>{{prettyDate}}</time><dt><span>Local</span></dt><dd>{{prettyVenue}}</dd></dd></dl><div class="more-info"><h3><span>Mais informação</span></h2>{{#if note}}<p><strong>{{note}}</strong>{{/if}} </p><p>{{description}}</p></div></div><div data-role="footer" data-position="fixed" name="footer" data-theme="c"><a data-role="none" href="http://queerlisboa.pt">Visite o queerlisboa.pt</a></div>'),
		
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
			this.spinner = new Spinner(App.spinnerOpts).spin();
			this.spinner.el.className = 'spinner';
			$(this.el).parents('[data-role="page"]').append(this.spinner.el);
			
			this.render();
		},
		
		disableAddButton: function() {			
			$(this.el).find('.addToMyList').parents('.ui-btn').remove();
			$(this.el).find('.addToMyList').remove();
			$(this.el).find('more-info').after('<button class="removeFromMyList" data-theme="f" data-icon="minus">Remover da minha agenda</button>');
			$(this.el).find('.removeFromMyList').button();
		},
		
		enableAddButton: function() {		
			$(this.el).find('.removeFromMyList').parents('.ui-btn').remove();
			$(this.el).find('.removeFromMyList').remove();
			$(this.el).find('more-info').after('<button class="addToMyList" data-theme="g" data-icon="add">Adicionar à minha agenda</button>');
			$(this.el).find('.addToMyList').button();
		},
		
		render: function() {
			var that = this,
				relatedFilms,
				filmCollection,
				filmsArray = [],
				filmView,
				modelData = this.model.toJSON(),
				date,
				spinner = new Spinner(App.spinnerOpts).spin(),
				oldPadding;
			
			this.spinner.stop();
			
			console.log(modelData);
			
			$(this.el)
			.addClass('event-page')
			.attr('id', 'event-' + that.model.id)
			.attr('data-theme', 'c')
			.attr('data-role', 'page');
			
			date = new Date(modelData.date);
			
			date.locale = 'pt-pt';
			
			modelData.prettyDate = date.strftime('%A, %d %B - %H:%M');
			modelData.urlDate = date.strftime('%Y-%m-%d');
			modelData.buttonDate = date.strftime('%d %b')
			
			if (modelData.venue.main) {
				modelData.prettyVenue = modelData.venue.main;
				if (modelData.venue.sub && modelData.venue.sub != null) modelData.prettyVenue += ' - ' + modelData.venue.sub;
			} else {
				modelData.prettyVenue = (modelData.venue.sub && modelData.venue.sub != null) ? modelData.venue.sub : 'Desconhecido';
			}
			
			
			if (!App.isPageRendered('event-' + this.model.id)) {
				$(this.el).append(this.template(modelData));
				$('body').append(this.el);
			}
			
			if (App.MyEvents.get(this.model.id)) {
				this.disableAddButton();
			} else {
				this.enableAddButton();
			}
			
			$.mobile.changePage($('#event-' + this.model.id), {changeHash: false, transition: App.transition || 'slide', reverse: App.reverseTransition});
			// Get related films
			if (this.model.get('type').toLowerCase() == 'film') {				
				relatedFilms = this.model.get('related').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				relatedFilms = relatedFilms.split(',');
				
				filmCollection = new App.FilmList;
				
				filmView = (relatedFilms.length > 1) ? App.MultiFilmView : App.FilmView;
				
				if (!App.isPageRendered('event-' + this.model.id)) $($.mobile.activePage).find('[data-role="content"]').append('<ul class="related-films" data-role="listview" data-theme="c"></ul>');
				
				if (!App.isPageRendered('event-' + this.model.id)) {
					_.each(relatedFilms, function(item) {
						filmsArray.push({id: item});
					});
					
					spinner.el.className = 'spinner';
					$(that.el).find('.related-films').before(spinner.el);
					
					oldPadding = $('#event-' + that.model.id).find('[data-role="content"]').css('padding-bottom');
					$('#event-' + that.model.id).find('[data-role="content"]').css('padding-bottom', '100px');
					
					filmCollection.add(filmsArray);
					// Waiting a little makes the transition smoother
					setTimeout(function() {
						filmCollection.fetch({dataType: App.method, success: function() {
							var fragment = document.createDocumentFragment();
							
							filmCollection.each(function(film) {
								var view = new filmView( {model: film} );
								fragment.appendChild(view.render().el);
							});
							
							spinner.stop();
							$('#event-' + that.model.id).find('[data-role="content"]').css('padding-bottom', oldPadding);
							$('#event-' + that.model.id).find('.related-films').append(fragment);
						}});
					}, 500);
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
			
			$('#showDate').find('[data-role="header"] h1').text(new Date(date).strftime('%a, %d %b'));
			
			this.spinner = new Spinner(App.spinnerOpts).spin();
			this.spinner.el.className = 'spinner';
			$(this.el).parents('[data-role="page"]').append(this.spinner.el);
			
			$.mobile.changePage($('#showDate'), {changeHash: false, transition: App.transition || 'slide', reverse: App.reverseTransition});
			
			// Waiting a little makes the transition smoother
			setTimeout(function() {
				App.Events.fetch({
					dataType: App.method,
					url: App.Events.url + date
				});
			}, 500);
			
		},
		
		render: function() {
			var $el = $(this.el),
			renderDivider = function(obj) {
				var template = Handlebars.compile('<li data-dividerID="{{hour}}" data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-btn ui-bar-a">{{hour}}</li>');
				
				return $(template(obj)).get(0);
			},
			fragment = document.createDocumentFragment(),
			date = new Date(this.date);
			
			this.spinner.stop();
			
			date.locale = 'pt-pt';
			
			$el.empty();
			
			
			App.Events.each(function(event) {
				var view = new App.EventView({model: event}),
				previousEvent = App.Events.at(App.Events.indexOf(event) - 1);
				
				if (!previousEvent || (previousEvent && previousEvent.get('hour') != event.get('hour'))) {
					fragment.appendChild(renderDivider({
						hour: event.get('hour')
					}));
				}
				
				fragment.appendChild(view.render().el);
			});
			
			$el.append(fragment);
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
			
			$(this.el).empty();
			
			this.spinner = new Spinner(App.spinnerOpts).spin();
			this.spinner.el.className = 'spinner';
			$(this.el).parents('[data-role="page"]').append(this.spinner.el);
			
			$.mobile.changePage($('#myAgenda'), {changeHash: false, transition: 'slideup', reverse: App.reverseTransition});
			
			// Waiting a little makes the transition smoother
			setTimeout(function() {
				App.MyEvents.fetch();
			}, 500);
		},
		
		render: function() {
			var $el = $(this.el),
			renderDivider = function(obj) {
				var template = Handlebars.compile('<li data-dividerID="{{hour}}" data-role="list-divider" role="heading">{{date}} - {{hour}}</li>');
				
				return $(template(obj)).get(0);
			},
			fragment = document.createDocumentFragment();
			
			this.spinner.stop();
			
			$(this.el).empty();
			
			// Add a message in case there are no events yet
			if (!App.MyEvents.length) {
				$(this.el).html('<p class="emptyMsg">Visite a página de um evento e adicione-o à sua agenda para poder construir o seu calendário personalizado!</p>')
			}
			
			
			App.MyEvents.each(function(event) {
				var view = new App.EventView({model: event}),
				previousEvent = App.MyEvents.at(App.MyEvents.indexOf(event) - 1),
				date = event.get('date').substr(0, event.get('date').indexOf('+'));
				
				date = new Date(Date.parse(date));
				
				if (previousEvent) console.log(previousEvent.get('hour'), previousEvent.get('title'), event.get('hour'));
				
				if (!previousEvent || (previousEvent && previousEvent.get('hour') != event.get('hour'))) {					
					fragment.appendChild(renderDivider({
						hour: event.get('hour'),
						date: date.strftime('%a, %d %b')
					}));
				}
				
				view.el.className = '';
				view.template = Handlebars.compile('<img src="img/ql-icon-20-{{imageType}}.png" class="ui-li-icon" /><a href="#/events/{{id}}" data-eventID="{{id}}" class="ui-link-inherit">{{title}}</a>');
				
				fragment.appendChild(view.render().el);
			});
			
			$el.append(fragment);
			
			try {
				$el.listview('refresh');
			} 
			catch (err) {
			}
			
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

		initialize: function() {
			var that = this;
			_.bindAll(this,'addOne','render');
			App.Dates.bind('reset', this.render);
			App.Dates.bind('add', this.addOne);
			
			$(this.el).empty();
			
			this.spinner = new Spinner(App.spinnerOpts).spin();
			this.spinner.el.className = 'spinner';
			$(this.el).parents('[data-role="page"]').append(this.spinner.el);
			
			$.mobile.changePage($('#dateSelection'), {changeHash: false, transition: App.transition || 'slide', reverse: App.reverseTransition});
			
			// Waiting a little makes the transition smoother
			setTimeout(function() {
				App.Dates.fetch({dataType: App.method});
			}, 500);
		},
		
		render: function() {
			var $el = $(this.el);
			this.spinner.stop();
			
			$el.empty();
			this.addAll();
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
			$.mobile.changePage($('#home'), {changeHash: false, reverse: App.reverseTransition});
			
			App.reverseTransition = false;
		},
		
		showMyEvents: function() {
			new App.MyEventListView;
			
		},
		
		showDatesPage: function() {
			var view = App.cachedViews['dateList'] || new App.DateListView;
			
			// transition right now if it is cached 
			if (App.cachedViews['dateList']) $.mobile.changePage($('#dateSelection'), {changeHash: false, transition: App.transition || 'slide', reverse: App.reverseTransition});
			
			App.cachedViews['dateList'] = view;
			
		},
		
		showDate: function(date) {	
			new App.EventListView(date);
		},
		
		showEvent: function(id) {
			var event = App.Events.get(id);
			
			if (!event) {
				event = new App.Event({id : id});
				
				// Waiting a little makes the transition smoother
				setTimeout(function() {
					event.fetch({dataType: App.method, success: function() {
						new App.ShowEventView({model: event});
					}});
				}, 500);
			} else {
				new App.ShowEventView({model: event});
			}
		}
		
	});
	
	App.Router = new App.Workspace;
	
	App.MyEvents.fetch();
})();

$(function() {
	
	var spinner = new Spinner(App.spinnerOpts).spin();
	spinner.el.className = 'spinner';
	$(spinner.el).css({position: 'absolute', top: '50%'});
	
	$('#loaderScreen').append(spinner.el);
	
	setTimeout(function() {
		Backbone.history.start();
	}, 1500);
	
	$('[data-rel="back"], .back').live('click', function() {
		App.reverseTransition = true;
	});
	
	$('a').live('click', function() {
		
		App.transition = $(this).attr('data-transition') || 'slide';
		App.reverseTransition = ($(this).attr('data-direction') == 'reverse');
		
	});
	
	$(window).resize(function() {
      var newHeight = $(window).width()*9/16,
      oldHeight = $('.youtube-video:first').attr("height");
      
      if (newHeight > 500)
          newHeight = 500;
      if (newHeight == oldHeight)
          return;
      $('.youtube-video').attr("height", newHeight);
    });    
});