import store from "../../app-store";
import layerCollection from "./layerCollection";
import LayerOl2dRasterWms from "./layerOl2dRasterWms";

const possibleLayerTypes = {
    WMS: LayerOl2dRasterWms
};

/**
 * Starts the creation of the layer in the layer factory
 * and register watcher.
 * @param {Object} visibleLayerConfigs The layer configurations.
 * @returns {void}
 */
export default function initializeLayerFactory (visibleLayerConfigs) {
    processLayerConfig(visibleLayerConfigs);
    registerLayerConfig();
}

/**
 * Register to the layers in layerConfig.
 * @returns {void}
 */
function registerLayerConfig () {
    store.watch((state, getters) => getters.allLayerConfigs, layerConfig => {
        processLayerConfig(layerConfig);
    });
}

/**
 * Creates a layer, if it is not yet present but visible.
 * Existing layers are updated.
 * @param {Object} layerConfig The layer configurations
 * @returns {void}
 */
function processLayerConfig (layerConfig) {
    layerConfig.forEach(layerConf => {
        const layer = layerCollection.getLayerById(layerConf.id);

        if (layer !== undefined) {
            updateLayerAttributes(layer, layerConf);
        }
        else if (layerConf.visibility === true) {
            layerCollection.addLayer(createLayer(layerConf));
        }
    });
}

/**
 * Creates layer instances.
 * @param {Object} layerConf The layer configuration.
 * @returns {Layer} The layer instance.
 */
export function createLayer (layerConf) {
    const typ = layerConf?.typ?.toUpperCase(),
        layer = new possibleLayerTypes[typ](layerConf);

    return layer;
}

/**
 * Update the layer attributes of the already extistering layer.
 * @param {Layer} layer Layer of the layer collection.
 * @param {Object} layerConf The layer config.
 * @returns {void}
 */
export function updateLayerAttributes (layer, layerConf) {
    Object.assign(layer.attributes, layerConf);
    layer.updateLayerValues(layer.attributes);
}

