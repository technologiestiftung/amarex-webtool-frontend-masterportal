import {createGfiFeature} from "../../../shared/js/utils/getWmsFeaturesByMimeType";

export default {
    /**
     * Sets the config-params of this MouseHover into state.
     * Adds the overlay and eventListener for the map.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @returns {void}
     */
    initialize ({commit, dispatch, state}) {
        const {numFeaturesToShow, infoText} = state,
            map = mapCollection.getMap("2D");
        let featuresAtPixel = [];

        dispatch("setMouseHoverLayers");
        commit("setMouseHoverInfos");
        map.addOverlay(state.overlay);

        if (numFeaturesToShow) {
            commit("setNumFeaturesToShow", numFeaturesToShow);
        }
        if (infoText) {
            commit("setInfoText", infoText);
        }
        map.on("pointermove", (evt) => {
            if (!state.isActive || evt.originalEvent.pointerType === "touch") {
                return;
            }
            featuresAtPixel = [];
            commit("setHoverPosition", evt.coordinate);
            map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                if (layer?.getVisible()) {
                    if (feature.getProperties().features) {
                        feature.get("features").forEach(clusteredFeature => {
                            featuresAtPixel.push(createGfiFeature(
                                layer,
                                "",
                                clusteredFeature
                            ));
                        });
                    }
                    else {
                        featuresAtPixel.push(createGfiFeature(
                            layer,
                            "",
                            feature
                        ));
                    }
                }
            });
            state.overlay.setPosition(evt.coordinate);
            state.overlay.setElement(document.querySelector("#mousehover-overlay"));
            commit("setInfoBox", null);

            if (featuresAtPixel.length > 0) {
                dispatch("filterInfos", featuresAtPixel);
            }
        });
    },

    /**
     * Sets the layers with a mouseHoverField to the state
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @returns {void}
     */
    setMouseHoverLayers ({commit, rootGetters}) {
        commit("setMouseHoverLayers", rootGetters.allLayerConfigs.filter(layer => {
            return layer?.mouseHoverField && layer.mouseHoverField !== "";
        }));
    },

    /**
     * Filters the infos from each feature that should be displayed.
     * @param {Object} param.commit the commit
     * @param {Object} param.state the state
     * @param {Array} features array of hovered Features
     * @returns {void}
     */
    filterInfos ({commit, state}, features) {
        const infoBox = [];

        if (features.length > 0) {
            features.forEach(feature => {
                const configInfosForFeature = state.mouseHoverInfos.find(info => info.id === feature.getLayerId());

                if (configInfosForFeature) {
                    const featureProperties = feature.getProperties(),
                        featureInfos = typeof configInfosForFeature.mouseHoverField === "string" ? configInfosForFeature.mouseHoverField : configInfosForFeature.mouseHoverField.filter(key => Object.keys(featureProperties).includes(key)),
                        featureDetails = [];

                    if (Array.isArray(featureInfos)) {
                        featureInfos.forEach(info => {
                            featureDetails.push(featureProperties[info]);
                        });
                    }
                    else {
                        featureDetails.push(featureProperties[featureInfos]);
                    }
                    infoBox.push(featureDetails);
                    commit("setPleaseZoom", features.length > state.numFeaturesToShow);
                    commit("setInfoBox", infoBox.slice(0, state.numFeaturesToShow));
                }
            });
        }
    }
};
