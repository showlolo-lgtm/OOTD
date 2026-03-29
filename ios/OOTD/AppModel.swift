import Combine
import Foundation

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var wardrobe: [WardrobeItem] = []
    @Published private(set) var scenarios: [CalendarScenario] = []
    @Published var draftScenario: CalendarScenario?
    @Published private(set) var recommendation: RecommendationResponse?
    @Published private(set) var isBootstrapping = false
    @Published private(set) var isRefreshingLooks = false
    @Published var errorMessage: String?
    @Published private(set) var selectedScenarioID = ""
    @Published private(set) var selectedCity: CityPreset
    @Published private(set) var zodiacSign: ZodiacSign
    @Published private(set) var lookPortraitsByLookID: [String: [LookPortraitImage]] = [:]
    @Published private(set) var generatingPortraitLookIDs: Set<String> = []

    private let api: APIClient
    private var hasBootstrapped = false
    private var lookRevision = 0

    private enum StorageKeys {
        static let city = "ootd.city"
        static let sign = "ootd.sign"
    }

    init(api: APIClient) {
        self.api = api
        self.selectedCity = .fallback
        self.zodiacSign = .gemini
        UserDefaults.standard.set(selectedCity.id, forKey: StorageKeys.city)
        UserDefaults.standard.set(zodiacSign.rawValue, forKey: StorageKeys.sign)
    }

    static func makeDefault() -> AppModel {
        AppModel(api: AppClientFactory.make())
    }

    var looks: [OutfitRecommendation] {
        recommendation?.outfits ?? []
    }

    var warnings: [String] {
        recommendation?.warnings ?? []
    }

    var summaryCityText: String {
        selectedCity.name
    }

    var summarySignText: String {
        zodiacSign.displayName
    }

    var summaryHeadline: String {
        if let context = recommendation?.context {
            return "\(selectedCity.name) • \(Int(context.weather.lowC))-\(Int(context.weather.highC))°C"
        }

        return "\(selectedCity.name) 明日穿搭计划"
    }

    var summaryBody: String {
        if let context = recommendation?.context {
            return "\(context.weather.summary)。\(context.fortune.summary)"
        }

        return "选择城市、星座和场景，生成明天的三套穿搭。"
    }

    func bootstrapIfNeeded() async {
        guard !hasBootstrapped else { return }
        await bootstrap()
    }

    func bootstrap() async {
        hasBootstrapped = true
        isBootstrapping = true
        errorMessage = nil
        defer { isBootstrapping = false }

        do {
            let wardrobe = try await api.fetchWardrobe()
            let scenarios = try await api.fetchScenarios().map(\.normalizedForDemo)
            self.wardrobe = wardrobe
            self.scenarios = scenarios

            if let firstScenario = scenarios.first {
                selectedScenarioID = firstScenario.id
                draftScenario = firstScenario
            }

            await refreshLooks()
        } catch {
            errorMessage = "无法连接服务。请启动后端，或使用内置演示数据。"
        }
    }

    func updateCity(_ city: CityPreset) {
        guard city != selectedCity else { return }
        selectedCity = city
        UserDefaults.standard.set(city.id, forKey: StorageKeys.city)
        Task { await refreshLooks() }
    }

    func updateZodiac(_ sign: ZodiacSign) {
        guard sign != zodiacSign else { return }
        zodiacSign = sign
        UserDefaults.standard.set(sign.rawValue, forKey: StorageKeys.sign)
        Task { await refreshLooks() }
    }

    func selectScenario(_ id: String) {
        guard id != selectedScenarioID, let next = scenarios.first(where: { $0.id == id }) else { return }
        selectedScenarioID = id
        draftScenario = next
        Task { await refreshLooks() }
    }

    func updateDraftTitle(_ title: String) {
        draftScenario?.title = title
    }

    func updateDraftLocation(_ location: String) {
        draftScenario?.location = location
    }

    func updateDraftStart(_ date: Date) {
        guard var scenario = draftScenario else { return }
        scenario.startTime = date
        if scenario.endTime <= date {
            scenario.endTime = date.addingTimeInterval(60 * 60)
        }
        draftScenario = scenario
    }

    func updateDraftEnd(_ date: Date) {
        guard var scenario = draftScenario else { return }
        scenario.endTime = max(date, scenario.startTime.addingTimeInterval(30 * 60))
        draftScenario = scenario
    }

    func refreshLooks() async {
        guard let draftScenario else { return }

        isRefreshingLooks = true
        errorMessage = nil
        defer { isRefreshingLooks = false }

        do {
            let nextRecommendation = try await api.fetchRecommendations(
                request: RecommendationRequestBody(
                    date: PreviewFixtures.tomorrowISODate(),
                    zodiacSign: zodiacSign,
                    location: selectedCity.location,
                    scenario: draftScenario
                )
            ).normalizedForDemo
            recommendation = nextRecommendation
            lookRevision += 1
            let revision = lookRevision
            lookPortraitsByLookID = [:]
            generatingPortraitLookIDs = Set(nextRecommendation.outfits.map(\.id))
            Task { await refreshLookPortraits(for: nextRecommendation.outfits, recommendation: nextRecommendation, revision: revision) }
        } catch {
            lookPortraitsByLookID = [:]
            generatingPortraitLookIDs = []
            errorMessage = "刷新穿搭失败，请检查接口地址或本地服务。"
        }
    }

    func wardrobeItemName(for id: String) -> String {
        wardrobe.first(where: { $0.id == id })?.name ?? id
    }

    func inspirationTitle(for id: String) -> String {
        recommendation?.context.inspiration.first(where: { $0.id == id })?.title ?? id
    }

    func lookPortraitURLs(for lookId: String) -> [URL] {
        (lookPortraitsByLookID[lookId] ?? []).compactMap { URL(string: $0.imageUrl) }
    }

    func isGeneratingPortraits(for lookId: String) -> Bool {
        generatingPortraitLookIDs.contains(lookId)
    }

    func rerollLook(_ lookId: String) {
        guard !generatingPortraitLookIDs.contains(lookId) else { return }
        Task { await rerollLookTask(lookId) }
    }

    private func refreshLookPortraits(
        for outfits: [OutfitRecommendation],
        recommendation: RecommendationResponse,
        revision: Int
    ) async {
        guard !outfits.isEmpty else { return }
        var pendingLookIDs = Set(outfits.map(\.id))

        for outfit in outfits {
            guard self.lookRevision == revision else {
                generatingPortraitLookIDs.subtract(pendingLookIDs)
                return
            }

            do {
                let response = try await api.fetchLookPortraits(
                    request: LookPortraitRequestBody(
                        looks: [
                            LookPortraitLookRequest(
                                lookId: outfit.id,
                                itemIds: outfit.itemIds,
                                title: outfit.summary
                            )
                        ],
                        city: selectedCity.name,
                        scenarioTitle: recommendation.context.scenario.title,
                        weatherSummary: recommendation.context.weather.summary,
                        fortuneSummary: recommendation.context.fortune.summary,
                        count: 1
                    )
                )

                guard self.lookRevision == revision else {
                    generatingPortraitLookIDs.subtract(pendingLookIDs)
                    return
                }

                if let portrait = response.portraits.first(where: { $0.lookId == outfit.id }) {
                    lookPortraitsByLookID[outfit.id] = portrait.images
                }
            } catch {
                guard self.lookRevision == revision else {
                    generatingPortraitLookIDs.subtract(pendingLookIDs)
                    return
                }
            }

            pendingLookIDs.remove(outfit.id)
            generatingPortraitLookIDs.remove(outfit.id)
        }
    }

    private func rerollLookTask(_ lookId: String) async {
        guard let recommendation, let draftScenario else { return }
        guard let outfitIndex = recommendation.outfits.firstIndex(where: { $0.id == lookId }) else { return }

        generatingPortraitLookIDs.insert(lookId)
        lookPortraitsByLookID[lookId] = nil

        do {
            let response = try await api.fetchRerolledLook(
                request: RerollLookRequestBody(
                    date: PreviewFixtures.tomorrowISODate(),
                    zodiacSign: zodiacSign,
                    location: selectedCity.location,
                    scenario: draftScenario,
                    lookId: lookId,
                    existingOutfits: recommendation.outfits
                )
            )

            guard let current = self.recommendation else {
                generatingPortraitLookIDs.remove(lookId)
                return
            }
            guard current.outfits.indices.contains(outfitIndex), current.outfits[outfitIndex].id == lookId else {
                generatingPortraitLookIDs.remove(lookId)
                return
            }

            var updatedOutfits = current.outfits
            updatedOutfits[outfitIndex] = response.outfit

            self.recommendation = RecommendationResponse(
                context: response.context.normalizedForDemo,
                outfits: updatedOutfits,
                warnings: mergedWarnings(current.warnings, response.warnings)
            )

            lookRevision += 1
            let revision = lookRevision
            await refreshLookPortraits(
                for: [response.outfit],
                recommendation: self.recommendation!,
                revision: revision
            )
        } catch {
            generatingPortraitLookIDs.remove(lookId)
            errorMessage = "这套暂时没能重搭成功，请再试一次。"
        }
    }

    private func mergedWarnings(_ existing: [String], _ incoming: [String]) -> [String] {
        var ordered = existing
        for warning in incoming where !ordered.contains(warning) {
            ordered.append(warning)
        }
        return ordered
    }
}
