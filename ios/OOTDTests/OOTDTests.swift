import XCTest
@testable import OOTD

@MainActor
final class OOTDTests: XCTestCase {
    func testBootstrapLoadsFixtureWardrobeAndLooks() async {
        let model = AppModel(api: FixtureAPIClient())

        await model.bootstrap()

        XCTAssertFalse(model.wardrobe.isEmpty)
        XCTAssertEqual(model.looks.count, 3)
        XCTAssertNil(model.errorMessage)
    }
}
