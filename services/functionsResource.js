/**
 * Defines a Restangular resource for the /functions/ API path.
 *
 * @param Restangular Handle to Restangular
 * @returns {object}
 */
function functionsResource(Restangular) {
    "use strict";

    // Base route for this resource
    var RESOURCE_ID = "functions";

    // Dedicated Restangular instance pointed at the resource
    var _allResource = Restangular.all(RESOURCE_ID);

    return {
        /**
         * Gets the entire collection of this resource's items.  Returns null
         * when this resource is null.
         *
         * @returns {Promise}
         */
        getList: function() {
            return ((null === _allResource) ? null : _allResource.getList());
        },

        /**
         * Gets a single identified item from this resource, returning the GET
         * Promise.
         *
         * @param resourceID {number} The identifier of the item to request
         * @returns {Promise}
         */
        getOne: function(resourceID) {
            var oneResource = Restangular.one(RESOURCE_ID, resourceID);
            return (null === oneResource ? null : oneResource.get());
        }
    };
}
