import SwiftUI

@main
struct OOTDApp: App {
    @StateObject private var model = AppModel.makeDefault()

    var body: some Scene {
        WindowGroup {
            ContentView(model: model)
                .task {
                    await model.bootstrapIfNeeded()
                }
        }
    }
}
