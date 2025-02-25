import {createStore} from "vuex";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import PrintComponent from "../../../components/PrintMap.vue";
import Print from "../../../store/indexPrint";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/Print/components/PrintMap.vue", () => {
    const scales = ["1000", "5000", "10000"],
        mockMapGetters = {
            scales: () => scales,
            scale: sinon.stub(),
            getView: sinon.stub(),
            mode: sinon.stub()
        },
        mockMapActions = {
            setResolutionByIndex: sinon.stub(),
            unregisterListener: sinon.stub()
        },
        value = "A0 Querformat",
        printLayout = {
            attributes: [
                {
                    default: "Countries",
                    name: "title",
                    type: "String"
                },
                {
                    name: "map",
                    type: "MapAttributeValues"
                }
            ],
            name: "A0 Querformat"
        },
        layoutList = [
            printLayout
        ];

    let store,
        wrapper,
        map = null;

    before(() => {
        map = {
            id: "ol",
            mode: "2D",
            render: sinon.spy(),
            updateSize: sinon.spy(),
            getLayers: sinon.spy(),
            getResolutionByScale: () => sinon.stub()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Print,
                        GetFeatureInfo: {
                            namespaced: true,
                            getters: {
                                currentFeature: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: mockMapGetters,
                    actions: mockMapActions
                }
            },
            getters: {
                uiStyle: sinon.stub(),
                mobile: sinon.stub()
            }
        });

        store.commit("Modules/Print/setLayoutList", layoutList);
        wrapper = mount(PrintComponent, {
            global: {
                plugins: [store]
            }});
    });

    afterEach(sinon.restore);

    describe("PrintMap.vue methods", () => {
        it("method layoutChanged sets other print layout", () => {
            store.commit("Modules/Print/setLayoutList", layoutList);
            wrapper.vm.layoutChanged(value);
            expect(store.state.Modules.Print.currentLayoutName).to.be.equals(value);
            expect(store.state.Modules.Print.currentLayout).to.be.deep.equals(printLayout);
            expect(store.state.Modules.Print.isGfiAvailable).to.be.equals(false);
            expect(store.state.Modules.Print.isLegendAvailable).to.be.equals(false);
        });
        it("method resetLayoutParameter sets isGfiAvailable and isLegendAvailabe to false", () => {
            store.commit("Modules/Print/setIsGfiAvailable", true);
            store.commit("Modules/Print/setIsLegendAvailable", true);

            wrapper.vm.resetLayoutParameter();
            expect(store.state.Modules.Print.isGfiAvailable).to.be.equals(false);
            expect(store.state.Modules.Print.isLegendAvailable).to.be.equals(false);
        });
    });

    describe("template", () => {
        it("should have an existing title", () => {
            expect(wrapper.find("#printToolNew")).to.exist;
        });

        it("should have an existing subtitle", () => {
            expect(wrapper.find("#subtitle").exists()).to.be.false;
            wrapper.vm.currentLayout.attributes[2] = {
                name: "subtitle"
            };
            expect(wrapper.find("#subtitle")).to.exist;
        });

        it("should have an existing free text field", () => {
            expect(wrapper.find("#textField").exists()).to.be.false;
            wrapper.vm.currentLayout.attributes[3] = {
                name: "textField"
            };
            expect(wrapper.find("#textField")).to.exist;
        });

        it("should have a close button", () => {
            expect(wrapper.find(".bi-x-lg")).to.exist;
        });

        it("should have a dropdown for layouts", () => {
            expect(wrapper.find("#printLayout").exists()).to.be.true;
        });
        it("should have a dropdown for formats", () => {
            expect(wrapper.find("#printFormat").exists()).to.be.true;
        });
        it("should have a dropdown for scales", () => {
            expect(wrapper.find("#printScale").exists()).to.be.true;
        });

        it("should have a downloads container", () => {
            expect(wrapper.find("#modules-print-downloads-container").exists()).to.be.true;
        });

        it("should show finish download file", () => {
            store.commit("Modules/Print/setFileDownloads", [{
                index: 0,
                title: "Micky",
                finishState: true,
                downloadUrl: "https://example.test",
                filename: "Maus"
            }]);

            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#modules-print-downloads-container").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-title-container").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-title").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-icon-container").exists()).to.be.true;
            expect(wrapper.find(".spinner-border").exists()).to.be.false;
            expect(wrapper.find(".modules-print-download-icon").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-button-container").exists()).to.be.true;
            expect(wrapper.find(".bi-download").exists()).to.be.true;
        });

        it("should show loader download file", () => {
            store.commit("Modules/Print/setFileDownloads", [{
                index: 1,
                title: "Donald",
                finishState: false,
                downloadUrl: "https://example.test",
                filename: "Duck"
            }]);

            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#modules-print-downloads-container").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-title-container").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-title").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-icon-container").exists()).to.be.true;
            expect(wrapper.find(".spinner-border").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-icon").exists()).to.be.false;
            expect(wrapper.find(".modules-print-download-button-container").exists()).to.be.true;
            expect(wrapper.find(".modules-print-download-button-active").exists()).to.be.false;
        });
        it("should have a legend checkbox", async () => {
            store.commit("Modules/Print/setIsLegendAvailable", true);

            await wrapper.vm.$nextTick();
            expect(store.state.Modules.Print.isLegendAvailable).to.be.equals(true);
            expect(wrapper.find("#printLegend").exists()).to.be.true;
        });

        it("should not have a checkbox of improving the resolution for 3d mode", () => {
            expect(wrapper.find("#printBetterQuality").exists()).to.be.false;
        });

        it("should have a checkbox of improving the resolution for 3d mode", async () => {
            store.commit("Modules/Print/setIs3d", true);

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#printBetterQuality").exists()).to.be.true;
        });
    });

    describe("returnScale", () => {
        it("should return an empty string if anything but a number is given", () => {
            expect(wrapper.vm.returnScale(undefined)).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale(null)).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale("string")).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale(true)).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale(false)).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale([])).to.be.a("string").and.to.be.empty;
            expect(wrapper.vm.returnScale({})).to.be.a("string").and.to.be.empty;
        });
        it("should return the given scale untouched if any number below 10.000 is given", () => {
            expect(wrapper.vm.returnScale(9999)).to.equal("9999");
            expect(wrapper.vm.returnScale(1)).to.equal("1");
            expect(wrapper.vm.returnScale(0)).to.equal("0");
            expect(wrapper.vm.returnScale(-1)).to.equal("-1");
            expect(wrapper.vm.returnScale(-999999)).to.equal("-999999");
        });
        it("should return the given scale with spaces as thousands separators if any number above 9.999 is given", () => {
            expect(wrapper.vm.returnScale(10000)).to.equal("10 000");
            expect(wrapper.vm.returnScale(999999)).to.equal("999 999");
            expect(wrapper.vm.returnScale(1000000)).to.equal("1 000 000");
        });
    });
    describe("gfi-option", () => {
        it("should deselect GFI when currentFeature changes", async () => {
            store.commit("Modules/Print/setIsGfiAvailable", true);
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});

            expect(wrapper.find("#printGfi").exists()).to.be.true;
            expect(wrapper.find("#printGfi").disabled).to.be.undefined;
            wrapper.find("#printGfi").setChecked();
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#printGfi").exists()).to.be.true;
            expect(wrapper.find("#printGfi").disabled).to.be.undefined;
            expect(wrapper.find("#printGfi").element.checked).to.be.true;
            store.commit("Modules/Print/setIsGfiSelected", false);
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#printGfi").exists()).to.be.true;
            expect(wrapper.find("#printGfi").element.checked).to.be.false;
        });
    });

    describe("hasLayoutAttribute", () => {
        it("should return true if the layout has the attribute", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const hasAttr = wrapper.vm.hasLayoutAttribute(wrapper.vm.currentLayout, "title");

            expect(hasAttr).to.be.true;
        });
        it("should return false if the layout has not the attribute", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const hasAttr = wrapper.vm.hasLayoutAttribute(wrapper.vm.currentLayout, "random");

            expect(hasAttr).to.be.false;
        });
        it("should return false if the given layout is not an object", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            expect(wrapper.vm.hasLayoutAttribute("", "random")).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute([], "random")).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute(true, "random")).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute(undefined, "random")).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute(null, "random")).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute(666, "random")).to.be.false;
        });
        it("should return false if the given attribute name is not a string", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            expect(wrapper.vm.hasLayoutAttribute({}, {})).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute({}, [])).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute({}, 666)).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute({}, undefined)).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute({}, null)).to.be.false;
            expect(wrapper.vm.hasLayoutAttribute({}, true)).to.be.false;
        });
    });

    describe("getLayoutAttributes", () => {
        it("should return an object the correct attribute", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const attributes = wrapper.vm.getLayoutAttributes(wrapper.vm.currentLayout, ["title"]);

            expect(attributes).to.be.an("object");
            expect(attributes).to.have.property("title");
        });
        it("should return an empty object if the attribute is not present", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const attributes = wrapper.vm.getLayoutAttributes(wrapper.vm.currentLayout, ["random"]);

            expect(attributes).to.be.empty;
        });
        it("should return an empty object if the given layout is not an object", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            expect(wrapper.vm.getLayoutAttributes("", "random")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes([], "random")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes(true, "random")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes(undefined, "random")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes(null, "random")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes(666, "random")).to.be.empty;
        });
        it("should return an empty object if the second given parameter is not an array", () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            expect(wrapper.vm.getLayoutAttributes({}, {})).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes({}, "666")).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes({}, 666)).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes({}, undefined)).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes({}, null)).to.be.empty;
            expect(wrapper.vm.getLayoutAttributes({}, true)).to.be.empty;
        });
    });
    describe("getOverviewmapLayerId", () => {
        it("should return the layer id that was configured and whose visibility is set to true", async () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const layerVisible = [{
                values_: {
                    id: "19968"
                }
            }];

            store.commit("Modules/Print/setOverviewmapLayerId", "19968");
            await wrapper.vm.$nextTick();
            wrapper.vm.setVisibleLayerList(layerVisible);
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.getOverviewmapLayerId()).to.be.equals("19968");
        });
        it("should not return the configured invisible layer id, but the default layer id ", async () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const layerVisible = [{
                values_: {
                    id: "19969"
                }
            }];

            store.commit("Modules/Print/setOverviewmapLayerId", "19968");
            await wrapper.vm.$nextTick();
            wrapper.vm.setVisibleLayerList(layerVisible);
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.getOverviewmapLayerId()).to.be.equals("19969");
        });
        it("should return the default layer id", async () => {
            wrapper = mount(PrintComponent, {
                global: {
                    plugins: [store]
                }});
            const layerVisible = [{
                values_: {
                    id: "19969"
                }
            }];

            store.commit("Modules/Print/setOverviewmapLayerId", undefined);
            await wrapper.vm.$nextTick();
            wrapper.vm.setVisibleLayerList(layerVisible);
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.getOverviewmapLayerId()).to.be.equals("19969");
        });
    });
});
