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
        XCTAssertEqual(app.staticTexts["lookCountLabel"].label, "3 套穿搭已就绪")

        app.buttons["city-tokyo"].tap()
        XCTAssertEqual(app.staticTexts["summaryCity"].label, "东京")

        app.buttons["zodiacMenu"].tap()
        app.buttons["水瓶座"].tap()
        XCTAssertEqual(app.staticTexts["summarySign"].label, "水瓶座")

        app.segmentedControls.buttons["客户"].tap()
        XCTAssertTrue(app.buttons["refreshButton"].exists)

        app.tabBars.buttons["衣橱"].tap()
        XCTAssertTrue(app.staticTexts["象牙白牛津衬衫"].waitForExistence(timeout: 2))

        app.tabBars.buttons["穿搭"].tap()
        XCTAssertTrue(app.staticTexts["lookTitle_0"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["lookTitle_2"].exists)
    }
}
