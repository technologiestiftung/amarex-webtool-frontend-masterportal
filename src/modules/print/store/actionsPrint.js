import axios from "axios";
import {DEVICE_PIXEL_RATIO} from "ol/has.js";

import actionsPrintInitialization from "./actionsPrintInitialization";
import BuildSpec from "../js/buildSpec";
import getCswRecordById from "../../../shared/js/api/getCswRecordById";
import layerProvider from "../js/getVisibleLayer";
import omit from "../../../shared/js/utils/omit";
import changeCase from "../../../shared/js/utils/changeCase";
import {takeScreenshot} from "olcs/lib/olcs/print/takeCesiumScreenshot.js";
import {computeRectangle} from "olcs/lib/olcs/print/computeRectangle.js";

const actions = {
    ...actionsPrintInitialization,

    /**
     * Performs an asynchronous HTTP request
     * @param {Object} param.dispatch the dispatch
     * @param {Object} serviceRequest the request content
     * @returns {void}
     */
    sendRequest: function ({dispatch}, serviceRequest) {
        const url = serviceRequest.serviceUrl;

        axios({
            url: url,
            type: serviceRequest.requestType
        }).then(response => {
            if (Object.prototype.hasOwnProperty.call(serviceRequest, "index")) {
                response.data.index = serviceRequest.index;
            }
            dispatch(String(serviceRequest.onSuccess), response.data);
        });
    },

    /**
     * sets the printStarted to activie for the Add Ons
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    activatePrintStarted: function ({commit}) {
        commit("setPrintStarted", true);
    },

    /**
     * sets the visibleLayerList
     * @param {Object} param.commit the commit
     * @param {Array} visibleLayerList the list
     * @returns {void}
     */
    setVisibleLayerList: function ({commit}, visibleLayerList) {
        commit("setVisibleLayerList", visibleLayerList);
    },

    /**
     * starts the printing process
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} print the print parameters.
     * @param {Function} print.getResponse The function that calls the axios request.
     * @param {Number} print.index The print index.
     * @returns {void}
     */
    startPrint3d: async function ({state, dispatch, commit}, print) {
        commit("setProgressWidth", "width: 25%");
        const ol3d = mapCollection.getMap("3D"),
            ol2d = ol3d.getOlMap(),
            view = ol2d.getView(),
            viewProjection = view.getProjection().getCode(),
            options = (function () {
                const evt = {ol3d: ol3d};

                dispatch("compute3dPrintMask");
                evt.printRectangle = computeRectangle(
                    evt.ol3d.getCesiumScene().canvas,
                    state.layoutMapInfo[0],
                    state.layoutMapInfo[1]);
                return evt.printRectangle;
            })(),
            screenshot = await takeScreenshot(ol3d.getCesiumScene(), options),
            fakeExtent = (function () {
                const res = view.getResolution(),
                    center = view.getCenter(),
                    width = options.width,
                    height = options.height;

                return [
                    center[0] - width / 2 * res, // xmin
                    center[1] - height / 2 * res, // ymin
                    center[0] + width / 2 * res, // xmax
                    center[1] + height / 2 * res // ymax
                ];
            })(),
            cesiumLayer = {
                type: "image",
                name: "Cesium",
                opacity: 1,
                imageFormat: "image/png",
                extent: fakeExtent,
                baseURL: screenshot
            },
            attr = {
                layout: state.currentLayoutName,
                outputFilename: state.filename,
                outputFormat: state.currentFormat,
                attributes: {
                    title: state.title,
                    is3dMode: true,
                    map: {
                        dpi: state.dpiForPdf,
                        projection: viewProjection,
                        bbox: fakeExtent,
                        useNearestScale: false,
                        useAdjustBounds: false
                    }
                }
            };
        let spec = BuildSpec;

        Object.assign(attr.attributes, print.layoutAttributes);
        spec.setAttributes(attr);
        if (state.isMetadataAvailable) {
            spec.setMetadata(true);
        }
        if (state.isScaleAvailable) {
            spec.buildScale(state.currentScale);
        }
        await spec.buildLayers(state.visibleLayerList);
        spec.defaults.attributes.map.layers = [cesiumLayer];
        // Use bbox instead of center + scale
        delete spec.defaults.attributes.map.scale;
        delete spec.defaults.attributes.map.center;
        spec.defaults.attributes.map.bbox = cesiumLayer.extent;
        if (state.isGfiAvailable) {
            dispatch("getGfiForPrint");
            spec.buildGfi(state.isGfiSelected, state.gfiForPrint);
        }
        if (state.isLegendAvailable) {
            spec.buildLegend(state.isLegendSelected, state.isMetadataAvailable, print.getResponse, print.index);
        }
        else {
            spec.setLegend({});
            spec.setShowLegend(false);
            spec = omit(spec, ["uniqueIdList"]);
            const printJob = {
                index: print.index,
                payload: spec.defaults,
                printAppId: state.printAppId,
                currentFormat: state.currentFormat,
                getResponse: print.getResponse
            };

            dispatch("createPrintJob", printJob);
        }
    },

    /**
     * starts the printing process
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} print the print parameters.
     * @param {Function} print.getResponse The function that calls the axios request.
     * @param {Number} print.index The print index.
     * @returns {void}
     */
    startPrint: async function ({state, getters, dispatch, commit}, print) {
        commit("setProgressWidth", "width: 25%");
        layerProvider.getVisibleLayer(state.printMapMarker);

        const visibleLayerList = getters.visibleLayerList,
            attr = {
                "layout": state.currentLayoutName,
                "outputFilename": state.filename,
                "outputFormat": state.currentFormat,
                "attributes": {
                    "title": state.title,
                    "map": {
                        "dpi": state.dpiForPdf,
                        "projection": mapCollection.getMapView("2D").getProjection().getCode(),
                        "center": mapCollection.getMapView("2D").getCenter(),
                        "scale": state.currentScale
                    }
                }
            };

        let spec = BuildSpec,
            printJob = {};

        Object.assign(attr.attributes, print.layoutAttributes);
        spec.setAttributes(attr);

        if (state.isMetadataAvailable) {
            spec.setMetadata(true);
        }

        if (state.isScaleAvailable) {
            spec.buildScale(state.currentScale);
        }
        await spec.buildLayers(visibleLayerList);

        if (state.isGfiAvailable) {
            dispatch("getGfiForPrint");
            spec.buildGfi(state.isGfiSelected, state.gfiForPrint);
        }
        if (state.isLegendAvailable) {
            spec.buildLegend(state.isLegendSelected, state.isMetadataAvailable, print.getResponse, print.index);
        }
        else {
            spec.setLegend({});
            spec.setShowLegend(false);
            spec = omit(spec, ["uniqueIdList"]);
            printJob = {
                index: print.index,
                payload: spec.defaults,
                printAppId: state.printAppId,
                currentFormat: state.currentFormat,
                getResponse: print.getResponse
            };

            dispatch("createPrintJob", printJob);
        }
    },

    /**
     * sets the metadata for print
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} cswObject the object with all the info
     * @returns {void}
     */
    getMetaDataForPrint: async function ({dispatch, rootGetters}, cswObject) {
        const cswObj = cswObject;
        let metadata;

        if (cswObj.layer.get("datasets") && Array.isArray(cswObj.layer.get("datasets")) && cswObj.layer.get("datasets")[0] !== null && typeof cswObj.layer.get("datasets")[0] === "object") {
            cswObj.cswUrl = Object.prototype.hasOwnProperty.call(cswObj.layer.get("datasets")[0], "csw_url") ? cswObj.layer.get("datasets")[0].csw_url : null;
        }

        cswObj.parsedData = {};

        if (cswObj.cswUrl === null || typeof cswObj.cswUrl === "undefined") {
            const cswId = Config.cswId || "3",
                cswService = rootGetters.restServiceById(cswId);

            cswObj.cswUrl = cswService.url;
        }

        if (rootGetters.metadata.useProxy.includes(cswObj.cswUrl)) {
            metadata = await getCswRecordById.getRecordById(cswObj.cswUrl, cswObj.metaId);
        }
        else {
            metadata = await getCswRecordById.getRecordById(cswObj.cswUrl, cswObj.metaId);
        }

        if (typeof metadata === "undefined") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.print.errorMessage", {cswObjCswUrl: cswObj.cswUrl})
            }, {root: true});
        }
        else {
            cswObj.parsedData = {};
            cswObj.parsedData.orgaOwner = metadata.getOwner().name || "n.N.";
            cswObj.parsedData.address = {
                street: metadata.getOwner().street || "",
                housenr: "",
                postalCode: metadata.getOwner().postalCode || "",
                city: metadata.getOwner().city || ""
            };
            cswObj.parsedData.email = metadata.getOwner().email || "n.N.";
            cswObj.parsedData.tel = metadata.getOwner().phone || "n.N.";
            cswObj.parsedData.url = metadata.getOwner().link || "n.N.";

            if (typeof metadata.getRevisionDate() !== "undefined") {
                cswObj.parsedData.date = metadata.getRevisionDate();
            }
            else if (typeof metadata.getPublicationDate() !== "undefined") {
                cswObj.parsedData.date = metadata.getPublicationDate();
            }
            else if (typeof metadata.getCreationDate() !== "undefined") {
                cswObj.parsedData.date = metadata.getCreationDate();
            }
        }

        BuildSpec.fetchedMetaData(cswObj);
    },

    /**
     * sends an async request to create a print job
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} printContent the content for the printRequest
     * @returns {void}
     */
    createPrintJob: async function ({state, dispatch, rootGetters, commit}, printContent) {
        const printJob = printContent,
            printId = printJob.printAppId || state.printAppId,
            printFormat = printJob.format || state.currentFormat;
        let url = "",
            response = "",
            serviceUrlDefinition = state.serviceUrl,
            filename = state.filename;

        if (state.printService !== "plotservice" && !state.serviceUrl.includes("/print/")) {
            serviceUrlDefinition = state.serviceUrl + "print/";
            filename = state.filename + "." + state.outputFormat;
        }

        commit("setPrintFileReady", false);
        if (state.serviceUrl === "") {
            let serviceUrl;

            if (state.mapfishServiceId !== "") {
                serviceUrl = rootGetters.restServiceById(state.mapfishServiceId).url;
            }
            else {
                serviceUrl = rootGetters.restServiceById("mapfish").url;
            }

            if (state.printService !== "plotservice" && !serviceUrl.includes("/print/")) {
                serviceUrl = serviceUrl + "print/";
            }

            commit("setServiceUrl", serviceUrl);
            serviceUrlDefinition = state.serviceUrl;
        }

        url = state.printService === "plotservice" ? serviceUrlDefinition + "/create.json" : serviceUrlDefinition + printId + "/report." + printFormat;

        commit("setProgressWidth", "width: 50%");
        if (typeof printJob.getResponse === "function") {
            if (state.printService === "plotservice") {
                printJob.payload = await dispatch("migratePayload", printJob.payload);
            }
            response = await printJob.getResponse(url, printJob.payload);
        }

        if ("getURL" in response.data) {
            await commit("setPlotserviceIndex", state.plotserviceIndex + 1);
            dispatch("downloadFile", {
                "fileUrl": response.data.getURL,
                "index": state.plotserviceIndex,
                "filename": filename
            });
        }
        else {
            response.data.index = printJob.index;
            dispatch("waitForPrintJob", response.data);
        }
    },

    /**
     * migrates the payload intended for mapfish to the format High Resolution Plot Service needs
     * @param {Object} param.state the state
     * @param {Object} payload object to migrate
     * @returns {Object} object for High Resolution Plot Service to start the printing
     */
    migratePayload: function ({state, rootState}, payload) {
        const plotservicePayload = {},
            encodedPayload = encodeURIComponent(JSON.stringify(payload)),
            payloadString = decodeURIComponent(encodedPayload).replace(/imageFormat/g, "format").replace(/image\/[^"]*/g, "image/png").replace(/"TRANSPARENT":"false"/gi, "\"TRANSPARENT\":\"true\""),
            decodePayload = JSON.parse(payloadString),
            scale = rootState?.Maps?.scale,
            resolution = rootState?.Maps?.resolution,
            center = decodePayload.attributes.map.center,
            // calculate width and height of print page in pixel
            mapInfo = state.layoutMapInfo,
            boundWidth = mapInfo[0] / state.DOTS_PER_INCH / state.INCHES_PER_METER * scale / resolution * DEVICE_PIXEL_RATIO,
            boundHeight = mapInfo[1] / state.DOTS_PER_INCH / state.INCHES_PER_METER * scale / resolution * DEVICE_PIXEL_RATIO,
            // half of width and height of the print page transformed to coordinates
            halfWidth = (boundWidth * resolution) / 2,
            halfHeight = (boundHeight * resolution) / 2,
            layout = decodePayload.layout,
            epsgCode = rootState.Maps.projection.code_;

        plotservicePayload.layout = layout;
        plotservicePayload.srs = decodePayload.attributes.map.projection;
        plotservicePayload.layers = decodePayload.attributes.map.layers;
        plotservicePayload.layers.forEach((key) => {
            key.styles = [""];
        });
        plotservicePayload.pages = [{
            center: center,
            scale: String(decodePayload.attributes.map.scale),
            scaleText: "Ca. 1 : " + decodePayload.attributes.map.scale,
            geodetic: true,
            dpi: String(decodePayload.attributes.map.dpi),
            mapTitle: decodePayload.attributes.title
        }];
        plotservicePayload.outputFilename = state.filename + "_";
        plotservicePayload.outputFormat = state.outputFormat;

        if (layout.indexOf("Legende") > 0) {
            plotservicePayload.legend = true;
        }
        if (plotservicePayload.addparam === undefined) {
            plotservicePayload.addparam = {};
        }
        plotservicePayload.addparamtype = "default";
        // calculate outer west, south, east and north coordinates of print page
        plotservicePayload.addparam.bboxwest = String(Math.round((center[0] - halfWidth) * 10) / 10.0) + " (" + epsgCode + ")";
        plotservicePayload.addparam.bboxsouth = String(Math.round((center[1] - halfHeight) * 10) / 10.0) + " (" + epsgCode + ")";
        plotservicePayload.addparam.bboxeast = String(Math.round((center[0] + halfWidth) * 10) / 10.0);
        plotservicePayload.addparam.bboxnorth = String(Math.round((center[1] + halfHeight) * 10) / 10.0);
        plotservicePayload.geometries = state.geometries;

        return JSON.stringify(plotservicePayload);
    },

    /**
     * Sends a request to get the status for a print job until it is finished.
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} response Response of print job.
     * @param {Number} response.index The print index.
     * @returns {void}
     */
    waitForPrintJob: async function ({state, dispatch, commit}, response) {
        let printFolderUrlPart = "";

        if (state.printService !== "plotservice" && !state.serviceUrl.includes("/print/")) {
            printFolderUrlPart = "print/";
        }

        const printAppId = state.printAppId,
            url = state.serviceUrl + printFolderUrlPart + printAppId + "/status/" + response.ref + ".json",
            serviceRequest = {
                "index": response.index,
                "serviceUrl": url,
                "requestType": "GET",
                "onSuccess": "waitForPrintJobSuccess"
            };

        commit("setProgressWidth", "width: 75%");
        dispatch("sendRequest", serviceRequest);
    },

    waitForPrintJobSuccess: async function ({state, dispatch, commit}, response) {
        let printFolderUrlPart = "";

        if (state.printService !== "plotservice" && !state.serviceUrl.includes("/print/")) {
            printFolderUrlPart = "print/";
        }

        // Error processing...
        if (response.status === "error") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.print.waitForPrintErrorMessage")
            }, {root: true});
            console.error("Error: " + response.error);
        }
        else if (response.done) {
            commit("setProgressWidth", "width: 100%");
            const index = response.downloadURL.lastIndexOf("/"),
                fileId = response.downloadURL.substr(index),
                fileSpecs = {
                    "index": response?.index,
                    "fileUrl": state.serviceUrl + printFolderUrlPart + state.printAppId + "/report" + fileId,
                    "filename": state.filename
                };

            dispatch("downloadFile", fileSpecs);
        }
        else {
            commit("setProgressWidth", "width: 80%");
            // The report is not ready yet. Check again in 2s.
            setTimeout(() => {
                const index = response.downloadURL.lastIndexOf("/"),
                    fileId = response.downloadURL.substr(index),
                    url = state.serviceUrl + printFolderUrlPart + state.printAppId + "/status" + fileId + ".json",
                    serviceRequest = {
                        "index": response.index,
                        "serviceUrl": url,
                        "requestType": "GET",
                        "onSuccess": "waitForPrintJobSuccess"
                    };

                dispatch("sendRequest", serviceRequest);
            }, 2000);
        }
    },

    /**
     * Starts the download from printfile,
     * @param {Object} param.commit the commit
     * @param {Object} fileSpecs The url to dwonloadfile and name
     * @returns {void}
     */
    downloadFile: function ({commit}, fileSpecs) {
        const fileUrl = fileSpecs.fileUrl;

        commit("setPrintStarted", false);
        commit("setPrintFileReady", true);

        commit("setFileDownloadUrl", fileUrl);
        commit("setFilename", fileSpecs.filename);

        if (fileSpecs.index !== undefined) {
            commit("updateFileDownload", {
                index: fileSpecs.index,
                finishState: true,
                downloadUrl: fileUrl
            });
        }
    },

    urlParams ({commit}, params) {
        Object.keys(params).forEach(key => {
            commit(`set${changeCase.upperFirst(key)}`, params[key]);
        });
    }
};

export default actions;
