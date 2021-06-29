/**
 * Utility function (idx) for traversing the given path of the given object
 * to retrieve data.
 * Copied from https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a.
 *
 * @param {Object} object The object to traverse.
 * @param {String[]} path The path of keys / indices to traverse through the object.
 * @returns {?*} The value(s) to be retrieved from the given object.
 */
export default (object, path) => path.reduce(
    (acc, currentVal) => acc && acc[currentVal] ? acc[currentVal] : null,
    object
);
