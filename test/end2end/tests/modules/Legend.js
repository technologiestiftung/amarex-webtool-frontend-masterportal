const webdriver = require("selenium-webdriver"),
    {expect} = require("chai"),
    {initDriver} = require("../../library/driver"),
    {getTextOfElements} = require("../../library/utils"),
    {isMaster, isCustom} = require("../../settings"),
    {By, until} = webdriver;

/**
 * Tests regarding map panning.
 * @param {e2eTestParams} params parameter set
 * @returns {void}
 */
async function LegendTests ({builder, config, url, resolution}) {
    const testIsApplicable = isMaster(url) || isCustom(url),
        expectedEntries = {
            master: ["Krankenhäuser", "Schulinfosystem"],
            custom: ["Krankenhäuser und Schulen", "Geobasiskarten (farbig)"]
        }[config];

    if (testIsApplicable) {
        describe("Legend", function () {
            let driver;

            before(async function () {
                driver = await initDriver(builder, url, resolution);
            });

            after(async function () {
                await driver.quit();
            });

            it("should contain active layers", async function () {
                // retry until functionality is active - may get stuck else
                do {
                    await (await driver.wait(
                        until.elementLocated(By.css("ul#root li.dropdown span.glyphicon-book")))
                    ).click();
                    await driver.wait(new Promise(r => setTimeout(r, 50)));
                } while (
                    // .legend-win only available from the start in master, must check for availability in custom
                    (await driver.findElements(By.css("div.legend-win"))).length === 0 ||
                    // additional check for master: since element is available from the start, wait until visible
                    !await (await driver.findElements(By.css("div.legend-win")))[0].isDisplayed()
                );

                const legendContent = await driver.wait(until.elementLocated(By.css("div.legend-win-content"))),
                    headers = await legendContent.findElements(By.tagName("h4")),
                    text = await getTextOfElements(headers);

                for (const entry of expectedEntries) {
                    expect(text).to.include(entry);
                }
            });
        });
    }
}

module.exports = LegendTests;
