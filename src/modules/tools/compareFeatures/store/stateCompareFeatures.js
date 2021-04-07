/**
 * User type definition
 * @typedef {Object} CompareFeaturesState
 * @property {Boolean} active if true, compareFeatures will rendered
 * @property {String} id id of the CompareFeatures component
 * @property {String} name displayed as title (config-param)
 * @property {String} glyphicon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Object} layerFeatures object with the features of a layer
 * @property {String} selectedLayer the currently selcted layer
 * @property {Boolean} showAlert if true modal gets shown
 * @property {Boolean} showMoreInfoButton if true the button for more Info is clickable
 * @property {Boolean} listFull if true no more features can be added to comparison list
 * @property {Boolean} hasFeatures if true comparison list gets rendered otherwise an infobox shows up
 * @property {Array} layerWithFeaturesToShow Array of the features to a selected layer
 * @property {Boolean} hasMultipleLayers if true multiple layers can be selected within the comparison list
 * @property {Boolean} showMoreInfo if true more info rows get rendered to comparison list
 * @property {Object} preparedList Object with the selected layers and their selected features
 * @property {String} emptyStar html element for empty star glyphicon in feedback modal
 * @property {String} yellowStar html element for yellow star glyphicon in feedback modal
 */
const state = {
    // defaults for config.json parameters
    name: "common:modules.tools.compareFeatures.title",
    glyphicon: "glyphicon-th-list",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: false,
    numberOfAttributesToShow: 12,
    numberOfFeaturesToShow: 3,
    // compareFeatures state
    active: false,
    id: "compareFeatures",
    layerFeatures: {},
    selectedLayer: "",
    showAlert: false,
    showMoreInfoButton: false,
    listFull: false,
    hasFeatures: false,
    layerWithFeaturesToShow: [],
    hasMultipleLayers: false,
    showMoreInfo: false,
    preparedList: {},
    iconEmptyStar: "<span class=\"glyphicon glyphicon-star-empty\" style=\"font-size:22px;\"></span>",
    iconYellowStar: "<span class=\"glyphicon glyphicon-star\" style=\"color:#fec44f; font-size:22px;\"></span>"
};

export default state;
