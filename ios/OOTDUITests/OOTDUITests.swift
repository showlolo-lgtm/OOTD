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

        XCTAssertTrue(app.buttons["今天"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["lookTitle_0"].waitForExistence(timeout: 3))

        app.buttons["明天"].tap()
        XCTAssertTrue(app.staticTexts["lookTitle_0"].waitForExistence(timeout: 2))

        app.buttons["衣橱"].tap()
        XCTAssertTrue(app.staticTexts["象牙白牛津衬衫"].waitForExistence(timeout: 2))

        app.buttons["我"].tap()
        XCTAssertTrue(app.staticTexts["天气"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["上海"].exists)
        XCTAssertTrue(app.staticTexts["双子座"].exists)
        XCTAssertTrue(app.staticTexts["湿度"].exists)
        XCTAssertTrue(app.staticTexts["48%"].exists)

        app.buttons["publishDockButton"].tap()
        XCTAssertTrue(app.otherElements["cameraPreview"].waitForExistence(timeout: 2))
        app.buttons["captureButton"].tap()
        XCTAssertTrue(app.buttons["fakePublishButton"].waitForExistence(timeout: 2))
    }
}
