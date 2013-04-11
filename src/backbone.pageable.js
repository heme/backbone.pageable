(function (factory) {
        "use strict";

    if (typeof exports === 'object') {
        module.exports = factory(require('backbone'), require('underscore'));
    } else if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore'], factory);
    } else {
        return factory(Backbone, _);
    }
}(function (Backbone, _) {
    "use strict";

    Backbone.Pageable = Backbone.Collection.extend({

        // Defaults
        pagination: {
            collection: null,
            request: {
                timeout: 25000,
                cache: false,
                type: 'GET',
                dataType: 'json'
            },
            state: {
                firstPage: 0,
                currentPage: 0,
                perPage: 10
            }, _state: {
                totalRecords: function() { return (!this.collection) ? 0 : this.collection.models.length; },
                startRecord: function() { var sr = (this.state.currentPage - 1) * this.state.perPage; return (sr > 0) ? sr : 0; },
                endRecord: function() { return this.state.currentPage * this.state.perPage; },
                totalPages: function() { var tp = ((!this.collection) ? 0 : this.collection.models.length) / this.state.perPage; return (tp > 1) ? tp : 1; },
                pages: function() {
                    var pages = [];
                    for(var x=0; x<this.state.totalPages; x++) {
                        pages[x] = {
                            'page-number':(x+1),
                            'status': (x+1 == this.state.currentPage) ? 'active' : ''
                        };
                    }
                    return pages;
                }
            },
            querystring: {
                'max': 100,
                'orderby': null,
                'sort': 'ASC'
            }, _querystring: {
                'start': function() {
                    if(!this.collection) {
                        return parseInt((this.state.firstPage * this.state.perPage) / this.querystring.max, 10) * this.querystring.max;
                    } else {
                        return this.collection.models.length;
                    }
                }
            },
            getState: function() {
                return _.clone(this.state);
            },
            update: function() {
                var keys = ['state','querystring'];
                 _.each(keys, function(value, key, collection){
                    var obj = _.clone(this['_' + value]);
                    _.each(obj, function(value, key, collection){
                        if(typeof value === 'function') {
                            collection[key] = value.call(this);
                        }
                    }, this);
                    this[value] = _.extend(this[value], obj);
                 }, this);
            },
            init: function(){
                this.pagination.setDefaults.call(this);
                this.pagination.collection = this;
                _.extend(this.pagination, new Backbone.Collection());
                this.on("sync", this.pagination.update, this.pagination);
                this.pagination.listenToOnce(this, "sync", this.pagination.nextPage);
            },
            setDefaults: function(){
                _.extend(this.pagination._request, this.pagination_request);
                _.extend(this.pagination._state, this.pagination_state);
                this.pagination._querystring.orderby = (this.pagination.querystring.orderby === null) ? this.model.prototype.idAttribute : null;
                _.extend(this.pagination._querystring, this.pagination_querystring);
                this.pagination.update.call(this.pagination);
            },
            changePage: function(){
                this.update();
                this.reset(this.collection.slice(this.state.startRecord, this.state.endRecord));
                if(this.state.totalPages > 0 && this.state.currentPage / this.state.totalPages > 0.66) {
                    this.collection.fetch({
                        data:this.querystring,
                        remove: false
                    });
                }
            },
            nextPage: function(){
                if(this.state.currentPage < this.state.totalPages) {
                    this.state.currentPage = ++this.state.currentPage;
                    this.changePage();
                }
            },
            prevPage: function(){
                if(this.state.currentPage > 1) {
                    this.state.currentPage = --this.state.currentPage;
                    this.changePage();
                }
            },
            goTo: function(page) {
                if(page !== undefined){
                    this.state.currentPage = parseInt(page, 10);
                    this.changePage();
                }
            }
        },

        // If Pageable is extended and this initialize is overwritten then 
        // you will need to make this same call in your initialize function
        initialize: function(){
            this.pagination.init.call(this);
        },

        sync: function(method, model, options) {
            var args = _.toArray(arguments);
            var data = (args[2].data) ? args[2].data : {};
            args[2].data = _.extend(data, this.pagination.querystring);
            return Backbone.sync.apply(this, args);
        }

    });
    
    return Backbone.Pageable;

}));