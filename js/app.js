$(function() {	
	//Override Underscore's default template delimiters
	/*
	_.templateSettings = {
  		interpolate : /\{\{(.+?)\}\}/g
	};
	*/
	
	//Define Model
	window.Event = Backbone.Model.extend({
		
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
	
	//Define Collection
	window.EventList = Backbone.Collection.extend({
		
		model: Event,
		
		url: 'http://queerlisboa.pt/api/programme/jsonp/get',
		
		parse : function(resp) {
			var nodeArray = [];	
			_.each(resp.nodes, function(obj){
				nodeArray.push(obj.node);
			});
			
			return nodeArray;
		}
		
		
		//storage: new Store('programme'),
		/*
		comparator: function(event) {
			return event.get('title');
		}
		*/
	});
	
	window.Events = new EventList;
	
	//Define View
	window.EventView = Backbone.View.extend({
		
		tagName: 'li',
		
		className: 'ui-btn ui-btn-up-c ui-btn-icon-right ui-li',
		
		template: Handlebars.compile('<div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="#event-{{id}}" class="ui-link-inherit">{{title}}</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span></div>'),
		
		events: {
			//'click' : "showTitle"
		},
		
		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render, this);
		},

		render: function() {
			var result = this.template(this.model.toJSON());
			$(this.el).attr('data-theme', 'c').html(result);
			return this;
		},
		/*
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
		
		showTitle: function() {
			alert(this.model.get('title'));
		}
		*/
	});
	
	//Define the top-level App View
	window.AppView = Backbone.View.extend({
		
		el: $('#programmeList'),
		
		events: {
		
		},
		
		initialize: function() {
			//Events.bind('add', 		this.addOne, this);
			//Events.bind('reset', 	this.addAll, this);
			//Events.bind('all', 		this.render, this);
		/*	
			Events.fetch( {dataType: 'jsonp', success: function(data) {
				var jsonData = data.toJSON(),
				nodeArray = [];
				
				_.each(jsonData[0].nodes, function(element){
					nodeArray.push(element.node);
				});
				
				data = nodeArray;
			}} );
		*/
			_.bindAll(this,'addOne','render');
			Events.bind('reset', this.render);
			Events.bind('add', this.addOne);
			Events.fetch({dataType: 'jsonp'});
		},
		
		render: function() {
			this.$('#programmeList').empty();
			Events.each(function(event) {
				var view = new EventView({model: event});
				this.$('#programmeList').append(view.render().el);
			});
		},
		
		addOne: function(event) {
			console.log('addOne');
			/*
			Events.fetch({dataType: 'jsonp', success: function(){
				var view = new EventView( {model: event} );
				view.render();
			}});
			*/
//			var view = new EventView( {model: event} );
//			$('#programmeList').append(view.render().el);
		},
		
		addAll: function() {
			Events.each(this.addOne);
		}
	});
	
	window.App = new AppView();
});