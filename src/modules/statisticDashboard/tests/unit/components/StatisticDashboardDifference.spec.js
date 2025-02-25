import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardDifference from "../../../components/StatisticDashboardDifference.vue";
import indexStatisticDashboard from "../../../store/indexStatisticDashboard";
import Multiselect from "vue-multiselect";
import StatisticSwitcher from "../../../components/StatisticDashboardSwitcher.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/statiscticDashboard/components/StatisticDashboardDifference.vue", () => {
    const propsData = {
        referenceData: {
            "date": [
                {label: "2000", value: "2000"},
                {label: "2001", value: "2001"},
                {label: "2002", value: "2002"}
            ],
            "region": [
                {label: "Wandsbek", value: "Wandsbek"},
                {label: "Hamburg", value: "Hamburg"},
                {label: "Deutschland", value: "Deutschland"}
            ]
        }
    };

    let store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: indexStatisticDashboard
                    }
                }
            }
        });
    });

    afterEach(sinon.restore);

    describe("Component DOM", () => {
        it("The title should exist", () => {
            const wrapper = shallowMount(StatisticDashboardDifference, {
                propsData: propsData,
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("h4").exists()).to.be.true;
        });

        it("should find switcher component", () => {
            const wrapper = shallowMount(StatisticDashboardDifference, {
                propsData: propsData,
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent(StatisticSwitcher).exists()).to.be.true;
        });

        it("The component multiselect should exist", () => {
            const wrapper = shallowMount(StatisticDashboardDifference, {
                propsData: propsData,
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent(Multiselect).exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("handleClickOutside", () => {
            it("should do nothing if closest function of param returns true", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                    propsData: propsData,
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.handleClickOutside({target: {closest: () => true}});
                expect(wrapper.emitted("showDifference")).to.be.undefined;

            });
            it("should emit showDifference with false as parameter", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                    propsData: propsData,
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.handleClickOutside({target: {closest: () => false}});
                expect(wrapper.emitted()).to.have.property("showDifference");
                expect(wrapper.emitted().showDifference[0]).to.deep.equal([false]);

            });
        });
        describe("updateSelectedReferenceData", () => {
            it("should set the selectedReferenceData to the emit object for date", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    expected = {
                        type: "date",
                        value: {
                            label: "1999",
                            value: "1999-01-01"
                        }
                    },
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedDate = {label: "1999", value: "1999-01-01"};
                wrapper.vm.updateSelectedReferenceData("date");

                expect(setSelectedReferenceDataStub.calledWith(expected)).to.be.true;
                expect(wrapper.vm.selectedRegion).to.be.an("string").that.is.empty;

                sinon.restore();
            });
            it("should set the selectedReferenceData to undefined for date if no vale for selectedDate is set", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedDate = undefined;
                wrapper.vm.updateSelectedReferenceData("date");

                expect(setSelectedReferenceDataStub.calledWith(undefined)).to.be.true;
                expect(wrapper.vm.selectedRegion).to.be.an("string").that.is.empty;

                sinon.restore();
            });
            it("should set the selectedReferenceData to the emit object for region", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    expected = {
                        type: "region",
                        value: "Hamburg"
                    },
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = "Hamburg";
                wrapper.vm.updateSelectedReferenceData("region");

                expect(setSelectedReferenceDataStub.calledWith(expected)).to.be.true;
                expect(wrapper.vm.selectedDate).to.be.an("string").that.is.empty;

                sinon.restore();
            });
            it("should set the selectedReferenceData to undefined for region", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = undefined;
                wrapper.vm.updateSelectedReferenceData("region");

                expect(setSelectedReferenceDataStub.calledWith(undefined)).to.be.true;
                expect(wrapper.vm.selectedDate).to.be.an("string").that.is.empty;

                sinon.restore();
            });
            it("should set the selectedReferenceData", async () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = "Hamburg";
                wrapper.vm.updateSelectedReferenceData("region");
                expect(setSelectedReferenceDataStub.called).to.be.true;

                sinon.restore();
            });
            it("should emit showDifference with false as parameter", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                    propsData: propsData,
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.updateSelectedReferenceData();
                expect(wrapper.emitted()).to.have.property("showDifference");
                expect(wrapper.emitted().showDifference[0]).to.deep.equal([false]);

            });
        });
    });
});
