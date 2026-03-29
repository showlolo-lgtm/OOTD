import Foundation

private struct WardrobeEnvelope: Decodable {
    let items: [WardrobeItem]
}

private struct ScenarioEnvelope: Decodable {
    let scenarios: [CalendarScenario]
}

struct RecommendationRequestBody: Encodable {
    let date: String
    let zodiacSign: ZodiacSign
    let location: LocationInput
    let scenario: CalendarScenario
}

protocol APIClient: Sendable {
    func fetchWardrobe() async throws -> [WardrobeItem]
    func fetchScenarios() async throws -> [CalendarScenario]
    func fetchRecommendations(request: RecommendationRequestBody) async throws -> RecommendationResponse
    func fetchRerolledLook(request: RerollLookRequestBody) async throws -> RerollLookResponse
    func fetchLookPortraits(request: LookPortraitRequestBody) async throws -> LookPortraitResponse
}

final class LiveAPIClient: APIClient, @unchecked Sendable {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder
    }

    func fetchWardrobe() async throws -> [WardrobeItem] {
        let envelope: WardrobeEnvelope = try await get(path: "/v1/wardrobe")
        return envelope.items
    }

    func fetchScenarios() async throws -> [CalendarScenario] {
        let envelope: ScenarioEnvelope = try await get(path: "/v1/calendar-scenarios")
        return envelope.scenarios
    }

    func fetchRecommendations(request: RecommendationRequestBody) async throws -> RecommendationResponse {
        try await post(path: "/v1/recommendations", body: request)
    }

    func fetchRerolledLook(request: RerollLookRequestBody) async throws -> RerollLookResponse {
        try await post(path: "/v1/recommendations/reroll-look", body: request)
    }

    func fetchLookPortraits(request: LookPortraitRequestBody) async throws -> LookPortraitResponse {
        try await post(path: "/v1/look-portraits", body: request, timeoutInterval: 180)
    }

    private func get<Response: Decodable>(path: String) async throws -> Response {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "GET"
        return try await send(request)
    }

    private func post<RequestBody: Encodable, Response: Decodable>(
        path: String,
        body: RequestBody,
        timeoutInterval: TimeInterval? = nil
    ) async throws -> Response {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        if let timeoutInterval {
            request.timeoutInterval = timeoutInterval
        }
        return try await send(request)
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try decoder.decode(Response.self, from: data)
    }
}

struct FixtureAPIClient: APIClient, Sendable {
    func fetchWardrobe() async throws -> [WardrobeItem] {
        PreviewFixtures.wardrobe
    }

    func fetchScenarios() async throws -> [CalendarScenario] {
        PreviewFixtures.scenarios()
    }

    func fetchRecommendations(request: RecommendationRequestBody) async throws -> RecommendationResponse {
        let city = CityPreset.demoCities.first { $0.location.city == request.location.city } ?? .fallback
        return PreviewFixtures.response(city: city, sign: request.zodiacSign, scenario: request.scenario)
    }

    func fetchRerolledLook(request: RerollLookRequestBody) async throws -> RerollLookResponse {
        let city = CityPreset.demoCities.first { $0.location.city == request.location.city } ?? .fallback
        let existing = request.existingOutfits
        let alternative = PreviewFixtures
            .response(city: city, sign: request.zodiacSign, scenario: request.scenario)
            .outfits
            .first { candidate in
                let candidateKey = candidate.itemIds.sorted().joined(separator: "|")
                return !existing.contains { $0.itemIds.sorted().joined(separator: "|") == candidateKey }
            } ?? existing.first ?? PreviewFixtures.response(city: city, sign: request.zodiacSign, scenario: request.scenario).outfits[0]

        return RerollLookResponse(
            context: PreviewFixtures.response(city: city, sign: request.zodiacSign, scenario: request.scenario).context,
            outfit: OutfitRecommendation(
                id: request.lookId,
                itemIds: alternative.itemIds,
                summary: alternative.summary,
                whyWeatherFit: alternative.whyWeatherFit,
                whyScenarioFit: alternative.whyScenarioFit,
                whyFortuneFit: alternative.whyFortuneFit,
                inspirationIds: alternative.inspirationIds
            ),
            warnings: []
        )
    }

    func fetchLookPortraits(request: LookPortraitRequestBody) async throws -> LookPortraitResponse {
        LookPortraitResponse(portraits: [], warnings: [], source: "fixture")
    }
}

enum AppClientFactory {
    static func make() -> APIClient {
        let processInfo = ProcessInfo.processInfo
        let usesFixture =
            processInfo.arguments.contains("UITEST_MOCK") ||
            processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"

        if usesFixture {
            return FixtureAPIClient()
        }

        let baseURL = URL(
            string: processInfo.environment["OOTD_API_BASE_URL"] ?? "http://127.0.0.1:8787"
        ) ?? URL(string: "http://127.0.0.1:8787")!
        return LiveAPIClient(baseURL: baseURL)
    }
}
