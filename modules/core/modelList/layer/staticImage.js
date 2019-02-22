import Layer from "./model";
import ImageLayer from 'ol/layer/Image.js';
import Projection from 'ol/proj/Projection.js';
import StaticImageSource from 'ol/source/ImageStatic.js';

const StaticImageLayer = Layer.extend({
    /**
     * [createLayerSource description]
     * @return {[type]} [description]
     */
    createLayerSource: function () {
        var extent = this.get("extend"),
        projection = new Projection({
          code: 'static-image',
          units: 'pixels',
          extent: extent
        });

        // ImageWMS can not be cached
        this.setLayerSource(new StaticImageSource({
            url: this.get("url"),
            projection: projection,
            imageExtent: extent
        }));
    },

        /**
     * [createLayer description]
     * @return {[type]} [description]
     */
    createLayer: function () {
        this.setLayer(new ImageLayer({
            source: this.get("layerSource"),
            name: this.get("name"),
            typ: 'StaticImage',
            transparency: this.get("transparency")
        }));
    },
    createLegendURL: function () {
    },
    checkForScale: function () {
    }
});

export default StaticImageLayer;
