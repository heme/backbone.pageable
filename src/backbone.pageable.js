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
                firstPage: 1,
                currentPage: 1,
                perPage: 10,
                totalPages: 10,
                totalRecords:0,
                startRecord:function(){ return (this.currentPage - 1) * this.perPage},
                endRecord: function(){ return this.currentPage * this.perPage -1}
            },
            querystring: {},
            initialize: function(){
                this.pagination.setDefaults.call(this);
                this.pagination.collection = this;
            },
            setDefaults: function(){
                _.extend(this.pagination.request, this.pagination_request);
                _.extend(this.pagination.state, this.pagination_state);
                _.extend(this.pagination.querystring, this.pagination_querystring);
            },
            fetch: function(){
                var fetchCollection = new Backbone.Collection();
                return fetchCollection.add(this.collection.slice(this.state.startRecord(), this.state.endRecord()));
            },
            toJSON: function(){
                return this.collection.slice(begin, end);
            }
        },

        // If Pageable is extended and this initialize is overwritten then 
        // you will need to make this same call in your initialize function
        initialize: function(){
            this.pagination.initialize.call(this);
        }

    });
    
    return Backbone.Pageable;

}));