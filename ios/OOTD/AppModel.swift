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
    private var looksByDay: [LookDay: [OutfitRecommendation]] = [:]
    private var contextsByDay: [LookDay: ContextSnapshot] = [:]
    private var warningsByDay: [LookDay: [String]] = [:]
    private var lookScenariosByLookID: [String: CalendarScenario] = [:]
    private var lookContextsByLookID: [String: ContextSnapshot] = [:]
    private var lookDaysByLookID: [String: LookDay] = [:]
    private var bundledPortraitFileNamesByLookID: [String: String] = [:]

    private enum StorageKeys {
        static let city = "ootd.city"
        static let sign = "ootd.sign"
    }

    private static let scenarioPriority: [String: Int] = [
        "client-rainy": 0,
        "commute-atelier": 1,
        "date-gallery": 2
    ]

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
        looks(for: .today)
    }

    var warnings: [String] {
        warningsByDay[.today] ?? recommendation?.warnings ?? []
    }

    var summaryCityText: String {
        selectedCity.name
    }

    var summarySignText: String {
        zodiacSign.displayName
    }

    var summaryHeadline: String {
        if let context = context(for: .today) ?? context(for: .tomorrow) {
            return "\(selectedCity.name) • \(Int(context.weather.lowC))-\(Int(context.weather.highC))°C"
        }

        return "\(selectedCity.name) 每日穿搭计划"
    }

    var summaryBody: String {
        if let context = context(for: .today) ?? context(for: .tomorrow) {
            return "\(context.weather.summary)。\(context.fortune.summary)"
        }

        return "根据客户、通勤和约会三个场景，生成每天三套风格不同的穿搭。"
    }

    func looks(for day: LookDay) -> [OutfitRecommendation] {
        looksByDay[day] ?? []
    }

    func context(for day: LookDay) -> ContextSnapshot? {
        contextsByDay[day] ?? recommendation?.context
    }

    func context(for lookId: String) -> ContextSnapshot? {
        lookContextsByLookID[lookId]
    }

    func scenarioTitle(for lookId: String) -> String {
        lookScenariosByLookID[lookId]?.title ?? "今日安排"
    }

    func scenario(for lookId: String) -> CalendarScenario? {
        lookScenariosByLookID[lookId]
    }

    func lookPortraitBundleFileName(for lookId: String) -> String? {
        bundledPortraitFileNamesByLookID[lookId]
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

        let bundledWardrobe = loadBundledWardrobe()
        wardrobe = CuratedHomeFixtures.wardrobeItems(fallback: bundledWardrobe ?? PreviewFixtures.wardrobe)
        scenarios = CuratedHomeFixtures.scenarios()

        if let defaultScenario = orderedScenarioTemplates().first {
            selectedScenarioID = defaultScenario.id
            draftScenario = defaultScenario
        }

        await refreshLooks()
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
        syncRecommendationSnapshot()
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
        isRefreshingLooks = true
        errorMessage = nil
        defer { isRefreshingLooks = false }

        let templates = orderedScenarioTemplates()
        guard !templates.isEmpty else { return }

        var nextLooksByDay: [LookDay: [OutfitRecommendation]] = [:]
        var nextContextsByDay: [LookDay: ContextSnapshot] = [:]
        var nextWarningsByDay: [LookDay: [String]] = [:]
        var nextLookScenarios: [String: CalendarScenario] = [:]
        var nextLookContexts: [String: ContextSnapshot] = [:]
        var nextLookDays: [String: LookDay] = [:]
        var nextBundledPortraits: [String: String] = [:]

        for curated in CuratedHomeFixtures.looks {
            guard let template = templates.first(where: { $0.id == curated.scenarioID }) else { continue }
            let scenario = template.shifted(to: curated.day)
            let context = CuratedHomeFixtures.context(for: curated.day, scenario: scenario, sign: zodiacSign)
            let look = curated.outfit.withID(curated.outfit.id)

            nextLooksByDay[curated.day, default: []].append(look)
            nextLookScenarios[look.id] = scenario
            nextLookContexts[look.id] = context
            nextLookDays[look.id] = curated.day
            nextBundledPortraits[look.id] = curated.portraitFileName
            nextWarningsByDay[curated.day, default: []] = []
        }

        for day in LookDay.allCases {
            nextLooksByDay[day] = (nextLooksByDay[day] ?? []).sorted {
                (Self.scenarioPriority[nextLookScenarios[$0.id]?.id ?? ""] ?? .max) <
                    (Self.scenarioPriority[nextLookScenarios[$1.id]?.id ?? ""] ?? .max)
            }

            if let firstLook = nextLooksByDay[day]?.first, let context = nextLookContexts[firstLook.id] {
                nextContextsByDay[day] = context
            }
        }

        looksByDay = nextLooksByDay
        contextsByDay = nextContextsByDay
        warningsByDay = nextWarningsByDay
        lookScenariosByLookID = nextLookScenarios
        lookContextsByLookID = nextLookContexts
        lookDaysByLookID = nextLookDays
        bundledPortraitFileNamesByLookID = nextBundledPortraits
        lookPortraitsByLookID = [:]
        generatingPortraitLookIDs = []
        syncRecommendationSnapshot()
    }

    func wardrobeItemName(for id: String) -> String {
        wardrobe.first(where: { $0.id == id })?.name ?? id
    }

    func inspirationTitle(for id: String) -> String {
        let contexts = Array(lookContextsByLookID.values)
        return contexts
            .compactMap { $0.inspiration.first(where: { $0.id == id })?.title }
            .first ?? id
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

    private func orderedScenarioTemplates() -> [CalendarScenario] {
        scenarios.sorted {
            let leftPriority = Self.scenarioPriority[$0.id] ?? .max
            let rightPriority = Self.scenarioPriority[$1.id] ?? .max
            return leftPriority < rightPriority
        }
    }

    private func fetchScenarioBundles(
        for day: LookDay,
        templates: [CalendarScenario]
    ) async throws -> [ScenarioBundle] {
        var bundles: [ScenarioBundle] = []

        for template in templates {
            let scenario = template.shifted(to: day)
            let response = try await api.fetchRecommendations(
                request: RecommendationRequestBody(
                    date: day.isoDate,
                    zodiacSign: zodiacSign,
                    location: selectedCity.location,
                    scenario: scenario
                )
            ).normalizedForDemo
            bundles.append(
                ScenarioBundle(
                    day: day,
                    scenario: scenario,
                    response: response
                )
            )
        }

        return bundles.sorted {
            (Self.scenarioPriority[$0.scenario.id] ?? .max) < (Self.scenarioPriority[$1.scenario.id] ?? .max)
        }
    }

    private func chooseLooks(for bundles: [ScenarioBundle]) -> [ScenarioSelection] {
        guard !bundles.isEmpty else { return [] }
        let wardrobeMap = Dictionary(uniqueKeysWithValues: wardrobe.map { ($0.id, $0) })
        let candidateGroups = bundles.map { bundle in
            bundle.response.outfits.prefix(3).map { outfit in
                ScenarioSelection(
                    day: bundle.day,
                    scenario: bundle.scenario,
                    context: bundle.response.context.normalizedForDemo,
                    outfit: outfit
                )
            }
        }

        var bestSelections: [ScenarioSelection] = []
        var bestScore = -Double.greatestFiniteMagnitude

        func search(groupIndex: Int, current: [ScenarioSelection]) {
            if groupIndex == candidateGroups.count {
                let score = combinationScore(for: current, wardrobeMap: wardrobeMap)
                if score > bestScore {
                    bestScore = score
                    bestSelections = current
                }
                return
            }

            let candidates = candidateGroups[groupIndex]
            if candidates.isEmpty {
                return
            }

            for candidate in candidates {
                search(groupIndex: groupIndex + 1, current: current + [candidate])
            }
        }

        search(groupIndex: 0, current: [])
        return bestSelections.isEmpty ? candidateGroups.compactMap(\.first) : bestSelections
    }

    private func combinationScore(
        for selections: [ScenarioSelection],
        wardrobeMap: [String: WardrobeItem]
    ) -> Double {
        var score = 0.0

        for (index, left) in selections.enumerated() {
            score += scenarioAffinityBonus(for: left, wardrobeMap: wardrobeMap)

            for right in selections.dropFirst(index + 1) {
                if routeType(for: left.outfit, wardrobeMap: wardrobeMap) != routeType(for: right.outfit, wardrobeMap: wardrobeMap) {
                    score += 9
                }

                if persona(for: left.outfit, wardrobeMap: wardrobeMap) != persona(for: right.outfit, wardrobeMap: wardrobeMap) {
                    score += 6
                }

                score -= Double(itemOverlap(between: left.outfit, and: right.outfit)) * 5.5
            }
        }

        return score
    }

    private func scenarioAffinityBonus(
        for selection: ScenarioSelection,
        wardrobeMap: [String: WardrobeItem]
    ) -> Double {
        let items = selection.outfit.itemIds.compactMap { wardrobeMap[$0] }
        let hasDress = items.contains(where: { $0.category == .dress })
        let hasOuterwear = items.contains(where: { $0.category == .outerwear })
        let hasHeels = items.contains(where: { $0.metadata?.subcategory.contains("高跟") == true })
        let hasLoafers = items.contains(where: { $0.metadata?.subcategory.contains("乐福") == true })
        let averageFormality = items.isEmpty ? 0 : items.map(\.formality).reduce(0, +) / Double(items.count)

        switch selection.scenario.id {
        case "client-rainy":
            return averageFormality * 1.2 + (hasOuterwear ? 4 : 0)
        case "commute-atelier":
            return (hasLoafers ? 4 : 0) + (!hasDress ? 3 : 0)
        case "date-gallery":
            return (hasDress ? 6 : 0) + (hasHeels ? 3 : 0)
        default:
            return 0
        }
    }

    private func routeType(
        for outfit: OutfitRecommendation,
        wardrobeMap: [String: WardrobeItem]
    ) -> String {
        let items = outfit.itemIds.compactMap { wardrobeMap[$0] }
        if items.contains(where: { $0.category == .dress }) {
            return "dress"
        }
        if items.contains(where: { $0.category == .outerwear }) {
            return "layered"
        }
        return "separates"
    }

    private func persona(
        for outfit: OutfitRecommendation,
        wardrobeMap: [String: WardrobeItem]
    ) -> String {
        outfit.itemIds
            .compactMap { wardrobeMap[$0]?.metadata?.stylePersona }
            .first ?? "neutral"
    }

    private func itemOverlap(
        between left: OutfitRecommendation,
        and right: OutfitRecommendation
    ) -> Int {
        let rightIDs = Set(right.itemIds)
        return left.itemIds.filter { rightIDs.contains($0) }.count
    }

    private func refreshLookPortraits(
        for outfits: [OutfitRecommendation],
        revision: Int
    ) async {
        guard !outfits.isEmpty else { return }
        var pendingLookIDs = Set(outfits.map(\.id))

        for outfit in outfits {
            guard self.lookRevision == revision else {
                generatingPortraitLookIDs.subtract(pendingLookIDs)
                return
            }

            guard let context = lookContextsByLookID[outfit.id], let scenario = lookScenariosByLookID[outfit.id] else {
                pendingLookIDs.remove(outfit.id)
                generatingPortraitLookIDs.remove(outfit.id)
                continue
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
                        scenarioTitle: scenario.title,
                        weatherSummary: context.weather.summary,
                        fortuneSummary: context.fortune.summary,
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
        guard
            let day = lookDaysByLookID[lookId],
            let scenario = lookScenariosByLookID[lookId],
            let existingOutfits = looksByDay[day],
            let outfitIndex = existingOutfits.firstIndex(where: { $0.id == lookId })
        else {
            return
        }

        generatingPortraitLookIDs.insert(lookId)
        lookPortraitsByLookID[lookId] = nil
        bundledPortraitFileNamesByLookID[lookId] = nil

        do {
            let response = try await api.fetchRerolledLook(
                request: RerollLookRequestBody(
                    date: day.isoDate,
                    zodiacSign: zodiacSign,
                    location: selectedCity.location,
                    scenario: scenario,
                    lookId: lookId,
                    existingOutfits: existingOutfits
                )
            )

            var updatedLooks = existingOutfits
            let normalizedContext = response.context.normalizedForDemo
            updatedLooks[outfitIndex] = response.outfit.withID(lookId)
            looksByDay[day] = updatedLooks
            lookScenariosByLookID[lookId] = normalizedContext.scenario
            lookContextsByLookID[lookId] = normalizedContext
            contextsByDay[day] = normalizedContext
            warningsByDay[day] = mergedWarnings(warningsByDay[day] ?? [], response.warnings)
            syncRecommendationSnapshot()

            lookRevision += 1
            let revision = lookRevision
            await refreshLookPortraits(
                for: [updatedLooks[outfitIndex]],
                revision: revision
            )
        } catch {
            generatingPortraitLookIDs.remove(lookId)
            errorMessage = "这套暂时没能重搭成功，请再试一次。"
        }
    }

    private func syncRecommendationSnapshot() {
        let preferredDay: LookDay = .tomorrow
        let snapshotContext =
            contextsByDay[preferredDay] ??
            contextsByDay[.today]
        let snapshotLooks =
            looksByDay[preferredDay] ??
            looksByDay[.today] ??
            []
        let snapshotWarnings =
            warningsByDay[preferredDay] ??
            warningsByDay[.today] ??
            []

        if let snapshotContext {
            recommendation = RecommendationResponse(
                context: snapshotContext,
                outfits: snapshotLooks,
                warnings: snapshotWarnings
            )
        } else {
            recommendation = nil
        }
    }

    private func lookID(for day: LookDay, scenarioID: String) -> String {
        "\(day.rawValue)-\(scenarioID)"
    }

    private func mergedWarnings(_ existing: [String], _ incoming: [String]) -> [String] {
        var ordered = existing
        for warning in incoming where !ordered.contains(warning) {
            ordered.append(warning)
        }
        return ordered
    }
}

private struct ScenarioBundle {
    let day: LookDay
    let scenario: CalendarScenario
    let response: RecommendationResponse
}

private struct ScenarioSelection {
    let day: LookDay
    let scenario: CalendarScenario
    let context: ContextSnapshot
    let outfit: OutfitRecommendation
}

private extension OutfitRecommendation {
    func withID(_ id: String) -> OutfitRecommendation {
        OutfitRecommendation(
            id: id,
            itemIds: itemIds,
            summary: summary,
            whyWeatherFit: whyWeatherFit,
            whyScenarioFit: whyScenarioFit,
            whyFortuneFit: whyFortuneFit,
            inspirationIds: inspirationIds
        )
    }
}

private func loadBundledWardrobe() -> [WardrobeItem]? {
    let bundledURL = Bundle.main.bundleURL
        .appending(path: "BundledWardrobe", directoryHint: .isDirectory)
        .appending(path: "wardrobe.generated.json")

    guard let data = try? Data(contentsOf: bundledURL) else { return nil }
    return try? JSONDecoder().decode([WardrobeItem].self, from: data)
}
