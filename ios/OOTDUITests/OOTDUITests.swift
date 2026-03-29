import XCTest

@MainActor
final class OOTDUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testDemoFlowUpdatesLooksAcrossTabs() throws {
        let app = XCUIApplication()
        app.launchArguments.append("UITEST_MOCK")
        app.launch()

        XCTAssertTrue(app.staticTexts["lookCountLabel"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["lookCountLabel"].label, "3 套已选好")

        app.buttons["明天"].tap()
        XCTAssertTrue(app.staticTexts["lookTitle_0"].waitForExistence(timeout: 2))

        app.buttons["衣橱"].tap()
        XCTAssertTrue(app.staticTexts["象牙白牛津衬衫"].waitForExistence(timeout: 2))

        app.buttons["我"].tap()
        XCTAssertTrue(app.buttons["city-tokyo"].waitForExistence(timeout: 2))
        app.buttons["city-tokyo"].tap()
        XCTAssertEqual(app.staticTexts["summaryCity"].label, "东京")

        app.buttons["zodiacMenu"].tap()
        app.buttons["水瓶座"].tap()
        XCTAssertEqual(app.staticTexts["summarySign"].label, "水瓶座")

        app.buttons["publishDockButton"].tap()
        XCTAssertTrue(app.navigationBars["打开相机"].waitForExistence(timeout: 2))
        app.buttons["captureButton"].tap()
        XCTAssertTrue(app.buttons["fakePublishButton"].waitForExistence(timeout: 2))
    }
}
