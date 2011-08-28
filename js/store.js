var Store = function(name) {
  this.name = name;
  
  console.log(name);
  //var store = localStorage.getItem(this.name);
  //this.data = (store && JSON.parse(store)) || {};
};

_.extend(Store.prototype, {
	find: function(model) {
		console.log('trying to find');
	},
	
	findAll: function(model) {
		console.log(model);
		console.log('trying to findAll here: ' + model.url);
		
		$.ajax({
            url: model.url,
            dataType: 'jsonp',
            success: function(data) {
            	console.log(data);
            	return data;
            }
        });
	}
});


Backbone.sync = function(method, model, options) {
  var resp,
  store = model.storage || model.collection.storage;

  switch (method) {
    case "read":    resp = model.id ? store.find(model) : store.findAll(model); break;
  }

  if (resp) {
    options.success(resp);
  } else {
    options.error("Record not found");
  }
};