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
                startIndex: null,
                currentPage: 1,
                perPage: 10,
                startPage:1,
                totalRecords:0,
                totalPages:0,
                pages:[],
                percentage:0
            }, _state: {
                startPage: function() {
                    return (this.state.startIndex / this.state.perPage) + 1;
                },
                totalRecords: function() {
                    return (!this.collection) ? 0 : this.collection.models.length;
                },
                pageStartRecord: function() {
                    var sr = (this.state.currentPage - this.state.startPage) * this.state.perPage;
                    return (sr > 0) ? sr : 0;
                },
                pageEndRecord: function() {
                    return ((this.state.currentPage+1) - this.state.startPage) * this.state.perPage;
                },
                totalPages: function() {
                    var tp = ((!this.collection) ? 0 : this.collection.models.length) / this.state.perPage;
                    return (tp > 0) ? tp : 0;
                },
                percentage: function() {
                    return (this.state.totalPages <= 0) ? 0 : (this.state.currentPage - this.state.startPage) / this.state.totalPages;
                },
                pages: function() {
                    var pages = [];
                    var startPage = this.state.startPage;
                    var x = 0;
                    while(x < this.state.totalPages) {
                        pages[x] = {
                            'page-number':(x + this.state.startPage),
                            'status': ((x + this.state.startPage) == this.state.currentPage) ? 'active' : ''
                        };
                        ++x;
                    }
                    return pages;
                }
            },
            querystring: {
                'start':0,
                'max': 100,
                'orderby': null,
                'sort': 'ASC'
            }, _querystring: {
                'start': function() {
                    var next = +(this.collection !== null);
                    return (parseInt((this.state.currentPage * this.state.perPage) / this.querystring.max, 10) + next) * this.querystring.max;
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
                 this.state.pages = this._state.pages.call(this);
            },
            init: function(){
                this.pagination.setDefaults.apply(this, arguments);
                this.pagination.collection = this;
                _.extend(this.pagination, new Backbone.Collection());
                this.on("sync", this.pagination.update, this.pagination);
                this.pagination.listenToOnce(this, "sync", this.pagination.changePage);
            },
            setDefaults: function(options){
                _.extend(this.pagination.request, this.pagination_request);
                _.extend(this.pagination._state, this.pagination_state);
                this.pagination._querystring.orderby = (this.pagination.querystring.orderby === null) ? this.model.prototype.idAttribute : null;
                _.extend(this.pagination._querystring, this.pagination_querystring);
                if(options.currentPage && options.currentPage > 0) {
                    this.pagination.state.currentPage = +options.currentPage;
                }
                this.pagination.update.call(this.pagination);
                this.pagination.state.startIndex = this.pagination.querystring.start;
            },
            changePage: function(){
                this.update();
                this.reset(this.collection.slice(this.state.pageStartRecord, this.state.pageEndRecord));
                if(this.state.percentage > 0.66) {
                    this.collection.fetch({
                        data:this.querystring,
                        remove: false
                    });
                }
            },
            nextPage: function(){
                if(this.state.currentPage < this.state.totalPages) {
                    ++this.state.currentPage;
                    this.changePage();
                }
            },
            prevPage: function(){
                if(this.state.currentPage > 1) {
                    --this.state.currentPage;
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
            this.pagination.init.apply(this, arguments);
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