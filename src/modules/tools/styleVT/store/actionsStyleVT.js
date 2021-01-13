import stateStyleVT from "./stateStyleVT";

const initialState = Object.assign({}, stateStyleVT),
    actions = {
        /**
         * Updates the list of vector tile layers to only include the currently visible layers.
         * Also clears the current set layer of the layerModel if it is not inside the updated list; the layer is no longer visible.
         *
         * @param {Object} context actions context object.
         * @returns {void}
         */
        refreshVectorTileLayerList ({state, commit}) {
            const {layerModel} = state,
                layerModelList = Radio.request("ModelList", "getModelsByAttributes", {typ: "VectorTile", isSelected: true}),
                vectorTileLayerList = [];

            if (layerModelList) {
                layerModelList.forEach(
                    model => vectorTileLayerList.push(
                        {
                            id: model.get("id"),
                            name: model.get("name")
                        }
                    ));
            }

            commit("setVectorTileLayerList", vectorTileLayerList);

            if (layerModel !== null && layerModel !== undefined) {
                const id = layerModel.get("id"),
                    result = vectorTileLayerList.find(
                        vectorTileLayer => vectorTileLayer.id === id
                    );

                if (result === undefined) {
                    commit("setLayerModel", null);
                }
            }
        },
        /**
         * Resets the state to its initial configuration.
         *
         * @param {Object} context actions context object.
         * @returns {void}
         */
        resetModule ({commit}) {
            commit("setLayerModel", initialState.layerModel);
            commit("setVectorTileLayerList", initialState.vectorTileLayerList);
        },
        /**
         * Activates or deactivates the module.
         * If the module is activated, a layerModel to be set is given and committed to the state.
         * Else, the module is reset.
         *
         * @param {Object} context actions context object.
         * @param {Object} payload payload object.
         * @param {Boolean} payload.active Whether to activate or deactivate the module.
         * @param {Backbone/Model/Item/Layer/VTLayer} payload.layerModel The layer selected to be initially selected.
         * @returns {void}
         */
        setActive ({commit, dispatch}, {active, layerModel}) {
            commit("setActive", active);

            if (active) {
                commit("setLayerModel", layerModel);
            }
            else {
                dispatch("resetModule");
            }
        },
        /**
         * Changes the style of the selected layer to the one of the one with the selected styleId.
         *
         * @param {Object} context actions context object.
         * @param {Event} event Event fired by changing the selected value for the style of the layer.
         * @param {HTMLSelectElement} event.target The HTML select element for the style of the layer.
         * @returns {void}
         */
        triggerStyleUpdate ({state}, {target}) {
            state.layerModel.setStyleById(target.value);
        }
    };

export default actions;
