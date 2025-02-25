import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import crs from "@masterportal/masterportalapi/src/crs";
import LayerPreviewComponent from "../../../components/LayerPreview.vue";
import LayerPreview from "../../../store/indexLayerPreview";
import wmts from "@masterportal/masterportalapi/src/layer/wmts";
import axios from "axios";

config.global.mocks.$t = key => key;

describe("src/modules/layerPreview/components/LayerPreview.vue", () => {
    let store,
        wrapper,
        warnSpy,
        layerWMTS,
        layerWMS,
        layerVectorTile,
        layerGroup,
        getWMTSCapabilitiesStub,
        loadSpy;

    const namedProjections = [
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"]
    ];

    before(() => {
        crs.registerProjections(namedProjections);
    });

    beforeEach(() => {
        warnSpy = sinon.spy();
        sinon.stub(console, "warn").callsFake(warnSpy);
        layerWMTS = {
            id: "WMTS",
            name: "layerWMTS",
            typ: "WMTS",
            type: "layer",
            capabilitiesUrl: "https://tiles.geoservice.dlr.de/service/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
            layers: "eoc:basemap",
            optionsFromCapabilities: true
        };
        layerWMS = {
            id: "WMS",
            name: "layerWMS",
            typ: "WMS",
            layers: "layers",
            version: "1.0.0",
            transparent: false,
            singleTile: false,
            tilesize: 20,
            url: "https://wms_url.de"
        };
        layerVectorTile = {
            id: "VectorTile",
            name: "layerVectorTile",
            typ: "VectorTile",
            type: "layer",
            preview: {
                src: "https://vectortile_url.de"
            }
        };
        layerGroup = {
            id: "GROUP",
            name: "groupLayer",
            typ: "GROUP",
            type: "layer",
            children: [layerWMS, {id: "WMS2",
                name: "layerWMS2",
                typ: "WMS"}]
        };

        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getResolutions: () => [2000, 1000, 500, 100, 50, 10],
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");

        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerPreview
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        initialCenter: () => [0, 0],
                        initialZoom: () => 3
                    }
                }
            },
            getters: {
                layerConfigById: () => (id) => {
                    if (id === "WMTS") {
                        return layerWMTS;
                    }
                    if (id === "WMS") {
                        return layerWMS;
                    }
                    if (id === "VectorTile") {
                        return layerVectorTile;
                    }
                    if (id === "GROUP") {
                        return layerGroup;
                    }
                    return null;
                },
                isMobile: () => false
            }
        });
        sinon.stub(LayerPreviewComponent.methods, "calculateExtent").returns([1, 2, 3, 4]);
        getWMTSCapabilitiesStub = sinon.stub(wmts, "getWMTSCapabilities").callsFake(() => new Promise(resolve => resolve({
            Contents: {
                Layer: [
                    {
                        Title: "EOC Basemap",
                        Identifier: "eoc:basemap",
                        Style: [
                            {
                                "Identifier": "_empty",
                                "isDefault": true
                            }
                        ],
                        Format: [
                            "image/png"
                        ],
                        TileMatrixSetLink: [
                            {
                                "TileMatrixSet": "EPSG:3857"
                            }
                        ],
                        ResourceURL: [
                            {
                                format: "image/png",
                                template: "https://tiles.geoservice.dlr.de/service/wmts/rest/eoc:basemap/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format=image/png",
                                resourceType: "tile"
                            }
                        ]
                    }
                ],
                TileMatrixSet: [
                    {
                        Identifier: "EPSG:3857",
                        SupportedCRS: "urn:ogc:def:crs:EPSG::3857",
                        TileMatrix: [
                            {
                                Identifier: "EPSG:3857:0",
                                ScaleDenominator: 559082263.9508929,
                                TopLeftCorner: [
                                    -20037508.34,
                                    20037508
                                ],
                                TileWidth: 256,
                                TileHeight: 256,
                                MatrixWidth: 1,
                                MatrixHeight: 1
                            }
                        ]
                    }
                ]
            }

        })));
        loadSpy = sinon.spy(LayerPreviewComponent.methods, "load");
        sinon.stub(axios, "get").returns(Promise.resolve({status: 200, data: []}));
    });

    afterEach(() => {
        sinon.restore();
    });

    it("do not render the LayerPreview for not supported layer-typ", async () => {
        const props = {
            layerId: "WFS"
        };

        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".layerPreview").exists()).to.be.false;
        expect(warnSpy.calledOnce).to.be.true;
    });

    it("do render the LayerPreview for supported layer-typ WMS", async () => {
        const props = {
            layerId: "WMS"
        };

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMS.url);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".layerPreview").exists()).to.be.true;
        expect(wrapper.find("img").attributes().src.indexOf(layerWMS.url)).to.be.equals(0);
        expect(loadSpy.calledOnce).to.be.true;
        expect(loadSpy.firstCall.args[0].indexOf(layerWMS.url)).to.be.equals(0);
        expect(warnSpy.notCalled).to.be.true;
    });

    it("do render the LayerPreview for supported layer-typ VectorTile", async () => {
        const props = {
            layerId: "VectorTile"
        };

        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".layerPreview").exists()).to.be.true;
        expect(wrapper.find("img").attributes().src).to.be.equals(layerVectorTile.preview.src);
        expect(warnSpy.notCalled).to.be.true;
    });

    it("do render the LayerPreview for supported layer-typ WMTS", async () => {
        const props = {
                layerId: "WMTS"
            },
            expectedURL = "https://tiles.geoservice.dlr.de/service/wmts/rest/eoc:basemap/_empty/EPSG:3857/EPSG:3857:0/0/0?format=image/png";

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMTS.capabilitiesUrl);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".layerPreview").exists()).to.be.true;
        expect(getWMTSCapabilitiesStub.calledOnce).to.be.true;
        expect(getWMTSCapabilitiesStub.firstCall.args[0]).to.be.equals(layerWMTS.capabilitiesUrl);
        expect(wrapper.find("img").attributes().src.indexOf(layerWMTS.capabilitiesUrl.split("?")[0])).to.be.equals(0);
        expect(loadSpy.calledOnce).to.be.true;
        expect(loadSpy.firstCall.args[0]).to.be.equals(expectedURL);
        expect(warnSpy.notCalled).to.be.true;
    });

    it("should emit previewClicked after click on preview if prop checkable is true", async () => {
        const props = {
            layerId: "WMS",
            checkable: true
        };

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMS.url);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();
        await wrapper.find(".checkable").trigger("click");

        expect(wrapper.emitted("previewClicked").length).to.equals(1);
    });

    it("should contain custom css-class, if prop customClass is given", async () => {
        const props = {
            layerId: "WMS",
            customClass: "customCSSClass"
        };

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMS.url);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.find(".customCSSClass").exists()).to.be.true;
    });

    it("should contain custom css-class 3 times, if prop customClass and checkable is given", async () => {
        const props = {
            layerId: "WMS",
            customClass: "customCSSClass",
            checkable: true
        };

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMS.url);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.findAll(".customCSSClass").length).to.be.equals(3);
    });

    it("generates new previewUrl if layerId changes", () => {
        const props = {
                layerId: "VectorTile"
            },
            generatePreviewUrlByConfigTypeSpy = sinon.spy(LayerPreviewComponent.methods, "generatePreviewUrlByConfigType");


        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });
        wrapper.vm.$options.watch.layerId.call(wrapper.vm, props.layerId);

        // called Twice: once in mounted and then in this watcher
        expect(generatePreviewUrlByConfigTypeSpy.calledTwice).to.equal(true);
    });

    it("do render the LayerPreview for supported layer-typ GROUP", async () => {
        const props = {
            layerId: "GROUP"
        };

        layerWMS.url = "https://groupUrl.de";

        sinon.stub(LayerPreviewComponent.methods, "getPreviewUrl").returns(layerWMS.url);
        wrapper = shallowMount(LayerPreviewComponent, {
            global: {
                plugins: [store]
            },
            props: props
        });

        expect(wrapper.find(".layerPreview").exists()).to.be.true;
        expect(wrapper.find("img").attributes().src.indexOf(layerWMS.url)).to.be.equals(0);
        expect(loadSpy.calledOnce).to.be.true;
        expect(loadSpy.firstCall.args[0].indexOf(layerWMS.url)).to.be.equals(0);
        expect(warnSpy.notCalled).to.be.true;
    });


});
