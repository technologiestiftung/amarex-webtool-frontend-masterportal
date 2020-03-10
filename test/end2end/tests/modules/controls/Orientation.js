const webdriver = require("selenium-webdriver"),
    {expect} = require("chai"),
    {isFirefox, isMaster, isCustom} = require("../../../settings"),
    {getCenter, mockGeoLocationAPI} = require("../../../library/scripts"),
    {initDriver} = require("../../../library/driver"),
    {By, until} = webdriver;

/**
 * @param {e2eTestParams} params parameter set
 * @returns {void}
 */
function Orientation ({builder, url, resolution, browsername}) {
    describe("Modules Controls GeoLocate", function () {
        let driver, geolocateButton;

        before(async function () {
            driver = await initDriver(builder, url, resolution);
            await driver.executeScript(mockGeoLocationAPI);
        });

        after(async function () {
            await driver.quit();
        });

        it("has a button for geolocating", async function () {
            await driver.wait(until.elementLocated(By.id("geolocate")), 9000);
            geolocateButton = await driver.findElement(By.id("geolocate"));

            expect(geolocateButton).to.exist;
        });

        (isCustom(url) ? it.skip : it)("relocates map after clicking the button", async function () {
            const center = await driver.executeScript(getCenter);

            await driver.wait(new Promise(r => setTimeout(r, 2500)));
            await geolocateButton.click();

            await driver.wait(until.elementLocated(By.id("geolocation_marker")));
            await driver.wait(until.elementIsVisible(await driver.findElement(By.id("geolocation_marker"))));

            expect(center).not.to.eql(await driver.executeScript(getCenter));
        });
    });

    // only configured in portal/master
    if (isMaster(url)) {
        describe.only("Modules Controls ProximitySearch", function () {
            let driver, poiButton;

            before(async function () {
                driver = await initDriver(builder, url, resolution);
                await driver.executeScript(mockGeoLocationAPI);

                const bikeAndRideSelector = By.xpath("//ul[@id='tree']/li[.//span[contains(.,'Bike and Ride')]]"),
                    themenSelector = By.xpath("//span[contains(.,'Themen')]"),
                    topicButton = await driver.wait(until.elementLocated(themenSelector));

                await topicButton.click();
                await (await driver.wait(until.elementLocated(bikeAndRideSelector, 5000, "Layerlist entry 'Bike and Ride' not found."))).click();
                await topicButton.click();
            });

            after(async function () {
                await driver.quit();
            });

            it("should have a poi button", async function () {
                poiButton = await driver.findElement(By.id("geolocatePOI"));
                await driver.wait(until.elementIsVisible(poiButton), 1000, "POI Button not visible.");

                expect(poiButton).to.exist;
            });

            it("should open the POI window after click on the poi button", async function () {
                await poiButton.click();

                await driver.wait(until.elementLocated(By.css("div.modal-dialog")));
                await driver.wait(until.elementLocated(By.xpath("//ul[contains(@class,'nav')]/li/a[contains(.,'500m')]")));
                await driver.wait(until.elementLocated(By.xpath("//ul[contains(@class,'nav')]/li/a[contains(.,'1000m')]")));
                await driver.wait(until.elementLocated(By.xpath("//ul[contains(@class,'nav')]/li/a[contains(.,'2000m')]")));
            });

            (isFirefox(browsername) ? it.skip : it)("should relocate after click on an item", async function () {
                await (await driver.findElement(By.xpath("//ul[contains(@class,'nav')]/li/a[contains(.,'2000m')]"))).click();

                const center = await driver.executeScript(getCenter),
                    firstResult = await driver.findElement(By.css("div.modal-dialog div.active table.table tr:first-child"));

                await driver.wait(until.elementIsVisible(firstResult));
                await firstResult.click();

                expect(center).not.to.eql(await driver.executeScript(getCenter));
            });
        });
    }
}

module.exports = Orientation;
