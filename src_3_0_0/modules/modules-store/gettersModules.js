import {generateSimpleGetters} from "../../shared/js/utils/generators";
import stateModules from "./stateModules";

import AddWMS from "../addWMS/components/AddWMS.vue";
import BufferAnalysis from "../bufferAnalysis/components/BufferAnalysis.vue";
import Contact from "../contact/components/ContactFormular.vue";
import CoordToolkit from "../coordToolkit/components/CoordToolkit.vue";
import CustomMenuElement from "../menu/components/CustomMenuElement.vue";
import Draw from "../draw/components/DrawItem.vue";
import FeatureLister from "../featureLister/components/FeatureLister.vue";
import FileImport from "../fileImport/components/FileImport.vue";
import FilterGeneral from "../filter/components/FilterGeneral.vue";
import Folder from "../menu/components/MenuFolder.vue";
import GetFeatureInfo from "../getFeatureInfo/components/GetFeatureInfo.vue";
import GraphicalSelect from "../../shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import Language from "../language/components/LanguageItem.vue";
import LayerClusterToggler from "../layerClusterToggler/components/LayerClusterToggler.vue";
import LayerInformation from "../layerInformation/components/LayerInformation.vue";
import LayerPills from "../layerPills/components/LayerPills.vue";
import LayerSelection from "../layerSelection/components/LayerSelection.vue";
import LayerSlider from "../layerSlider/components/LayerSlider.vue";
import LayerTree from "../layerTree/components/LayerTree.vue";
import Legend from "../legend/components/LegendContainer.vue";
import Measure from "../measure/components/MeasureInMap.vue";
import MouseHover from "../mouseHover/components/MouseHover.vue";
import NewsView from "../news/components/NewsView.vue";
import OpenConfig from "../openConfig/components/OpenConfig.vue";
import PortalFooter from "../portalFooter/components/PortalFooter.vue";
import PrintMap from "../print/components/PrintMap.vue";
import Routing from "../routing/components/RoutingTemplate.vue";
import ScaleSwitcher from "../scaleSwitcher/components/ScaleSwitcher.vue";
import SelectFeatures from "../selectFeatures/components/SelectFeatures.vue";
import Shadow from "../shadow/components/ShadowTool.vue";
import ShareView from "../shareView/components/ShareView.vue";
import StyleVT from "../styleVT/components/StyleVT.vue";
import WfsSearch from "../wfsSearch/components/WfsSearch.vue";

const getters = {
    ...generateSimpleGetters(stateModules),

    componentMap: () => {
        const coreModules = {
            addWMS: AddWMS,
            bufferAnalysis: BufferAnalysis,
            contact: Contact,
            coordToolkit: CoordToolkit,
            customMenuElement: CustomMenuElement,
            draw: Draw,
            featureLister: FeatureLister,
            fileImport: FileImport,
            filter: FilterGeneral,
            folder: Folder,
            getFeatureInfo: GetFeatureInfo,
            graphicalSelect: GraphicalSelect,
            language: Language,
            layerClusterToggler: LayerClusterToggler,
            layerInformation: LayerInformation,
            layerPills: LayerPills,
            layerSelection: LayerSelection,
            layerSlider: LayerSlider,
            layerTree: LayerTree,
            legend: Legend,
            measure: Measure,
            mouseHover: MouseHover,
            news: NewsView,
            openConfig: OpenConfig,
            portalFooter: PortalFooter,
            print: PrintMap,
            routing: Routing,
            scaleSwitcher: ScaleSwitcher,
            selectFeatures: SelectFeatures,
            shadow: Shadow,
            shareView: ShareView,
            styleVT: StyleVT,
            wfsSearch: WfsSearch
        };

        moduleCollection = {...coreModules, ...moduleCollection};
        return moduleCollection;
    }
};

export default getters;
