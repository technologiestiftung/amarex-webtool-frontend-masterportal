/* eslint-disable no-console */
const {PORTALCONFIG_OLD} = require("./constants"),
    {deleteTranslateInName, removeAttributesFromTools} = require("./utils");

module.exports = function createSecondaryMenu (data, migratedTools, toRemoveFromTools) {
    console.info("secondaryMenu");
    const secondaryMenu = {
        expanded: false,
        sections: [[]]
    };

    fillSections(data, secondaryMenu, migratedTools, toRemoveFromTools);
    return secondaryMenu;
};

/**
 * Fills the menu sections of secondary menu with tools contained in v2 config.json.
 * @param {Object} data parsed config.json content
 * @param {Object} secondaryMenu v3 secondary menu object
 * @param {Array} migratedTools already migrated v2 tools
 *  @param {Object} toRemoveFromTools attributes to remove from tools by type
 * @returns {void}
 */
function fillSections (data, secondaryMenu, migratedTools, toRemoveFromTools) {
    console.info("   tools");
    const menu = data[PORTALCONFIG_OLD].menu,
        tools = menu.tools?.children,
        section = secondaryMenu.sections[0];

    if (tools) {
        Object.entries(tools).forEach(([toolName, toolConfig]) => {
            if (!migratedTools.includes(toolName)) {
                let tool = {...toolConfig},
                    name = toolName;

                if (name.toLowerCase() === "coordtoolkit") {
                    name = "coordToolkit";
                }
                console.info("       " + name);

                if (name === "layerClusterToggler") {
                    console.info("--- HINT configuration of LayerClusterToggler in Layers must be done by hand. 'Suffix' is replaced by direct suffix at layer id.");
                }
                if (name === "draw") {
                    name = "draw_old";
                }
                if (name === "wfsSearch") {
                    const regex = /"type":/g;

                    tool = JSON.parse(JSON.stringify(tool).replace(regex, "\"queryType\":"));
                }
                tool.type = name;
                deleteTranslateInName(tool);
                removeAttributesFromTools(toRemoveFromTools, tool);
                section.push(tool);
                migratedTools.push(toolName);
            }
        });
    }
    Object.entries(menu).forEach(([menuName, menuConfig]) => {
        if (!["info", "tree", "ansichten", "tools"].includes(menuName) && !migratedTools.includes(menuName)) {
            const config = {...menuConfig};

            config.type = menuName;
            removeAttributesFromTools(toRemoveFromTools, config);
            console.info("       " + menuName);
            section.push(config);
            migratedTools.push(menuName);
        }
    });
}

