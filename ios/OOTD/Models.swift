import Foundation

enum ZodiacSign: String, CaseIterable, Codable, Identifiable {
    case aries
    case taurus
    case gemini
    case cancer
    case leo
    case virgo
    case libra
    case scorpio
    case sagittarius
    case capricorn
    case aquarius
    case pisces

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .aries: "白羊座"
        case .taurus: "金牛座"
        case .gemini: "双子座"
        case .cancer: "巨蟹座"
        case .leo: "狮子座"
        case .virgo: "处女座"
        case .libra: "天秤座"
        case .scorpio: "天蝎座"
        case .sagittarius: "射手座"
        case .capricorn: "摩羯座"
        case .aquarius: "水瓶座"
        case .pisces: "双鱼座"
        }
    }
}

struct LocationInput: Codable, Equatable {
    let city: String
    let lat: Double
    let lon: Double
}

struct CityPreset: Identifiable, Equatable {
    let id: String
    let name: String
    let location: LocationInput

    static let demoCities: [CityPreset] = [
        CityPreset(
            id: "shanghai",
            name: "上海",
            location: LocationInput(city: "上海", lat: 31.2304, lon: 121.4737)
        ),
        CityPreset(
            id: "tokyo",
            name: "东京",
            location: LocationInput(city: "东京", lat: 35.6762, lon: 139.6503)
        ),
        CityPreset(
            id: "london",
            name: "伦敦",
            location: LocationInput(city: "伦敦", lat: 51.5072, lon: -0.1276)
        ),
        CityPreset(
            id: "san-francisco",
            name: "旧金山",
            location: LocationInput(city: "旧金山", lat: 37.7749, lon: -122.4194)
        )
    ]

    static let fallback = demoCities[0]

    static func fromSavedID(_ id: String?) -> CityPreset {
        demoCities.first { $0.id == id } ?? fallback
    }
}

enum ClothingCategory: String, Codable {
    case top
    case bottom
    case outerwear
    case dress
    case shoes
    case accessory

    var title: String {
        switch self {
        case .top:
            "上装"
        case .bottom:
            "下装"
        case .outerwear:
            "外套"
        case .dress:
            "连衣裙"
        case .shoes:
            "鞋履"
        case .accessory:
            "配饰"
        }
    }

    var symbolName: String {
        switch self {
        case .top:
            "tshirt"
        case .bottom:
            "square.split.2x1"
        case .outerwear:
            "coat"
        case .dress:
            "sparkles"
        case .shoes:
            "shoeprints.fill"
        case .accessory:
            "star.square.on.square"
        }
    }
}

struct WardrobeItem: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let category: ClothingCategory
    let colors: [String]
    let seasons: [String]
    let formality: Double
    let warmth: Double
    let tags: [String]
    let imageUrl: String
    let metadata: WardrobeMetadata?
}

struct WardrobeMetadata: Codable, Hashable {
    let audience: String
    let subcategory: String
    let material: String
    let pattern: String
    let fit: String
    let silhouette: String
    let stylePersona: String?
    let keywords: [String]
    let styleDirection: String
    let imagePrompt: String
    let negativePrompt: String
    let imagePath: String
    let heelHeightCm: Double?
    let shaftHeight: String?
    let waterproof: Bool?
}

struct CalendarScenario: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var startTime: Date
    var endTime: Date
    var location: String
    var occasionTags: [String]
}

struct WeatherSnapshot: Codable, Hashable {
    let date: String
    let highC: Double
    let lowC: Double
    let apparentHighC: Double
    let apparentLowC: Double
    let precipitationProbability: Double
    let weatherCode: Int
    let summary: String
    let isRainLikely: Bool
    let styleTags: [String]
}

struct FortuneSnapshot: Codable, Hashable {
    let sign: ZodiacSign
    let summary: String
    let luckyColor: String
    let mood: String
    let focus: String
    let energy: String
}

struct InspirationItem: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let sourceName: String
    let sourceUrl: String
    let summary: String
    let weatherTags: [String]
    let occasionTags: [String]
    let palette: [String]
    let formality: Double
    let warmth: Double
    let vibe: String
    let keywords: [String]
}

struct ContextSnapshot: Codable, Hashable {
    let date: String
    let scenario: CalendarScenario
    let weather: WeatherSnapshot
    let fortune: FortuneSnapshot
    let inspiration: [InspirationItem]
}

struct OutfitRecommendation: Codable, Identifiable, Hashable {
    let id: String
    let itemIds: [String]
    let summary: String
    let whyWeatherFit: String
    let whyScenarioFit: String
    let whyFortuneFit: String
    let inspirationIds: [String]
}

struct RecommendationResponse: Codable, Hashable {
    let context: ContextSnapshot
    let outfits: [OutfitRecommendation]
    let warnings: [String]
}

struct RerollLookRequestBody: Encodable {
    let date: String
    let zodiacSign: ZodiacSign
    let location: LocationInput
    let scenario: CalendarScenario
    let lookId: String
    let existingOutfits: [OutfitRecommendation]
}

struct RerollLookResponse: Codable, Hashable {
    let context: ContextSnapshot
    let outfit: OutfitRecommendation
    let warnings: [String]
}

struct LookPortraitLookRequest: Codable, Hashable {
    let lookId: String
    let itemIds: [String]
    let title: String?
}

struct LookPortraitRequestBody: Encodable {
    let looks: [LookPortraitLookRequest]
    let city: String
    let scenarioTitle: String
    let weatherSummary: String
    let fortuneSummary: String
    let count: Int
}

struct LookPortraitImage: Codable, Hashable, Identifiable {
    let id: String
    let imageUrl: String
    let prompt: String
}

struct LookPortraitResult: Codable, Hashable {
    let lookId: String
    let images: [LookPortraitImage]
}

struct LookPortraitResponse: Codable, Hashable {
    let portraits: [LookPortraitResult]
    let warnings: [String]
    let source: String
}

extension CalendarScenario {
    var normalizedForDemo: CalendarScenario {
        var copy = self
        if copy.id == "date-gallery" {
            copy.location = "新天地"
        }
        return copy
    }
}

extension ContextSnapshot {
    var normalizedForDemo: ContextSnapshot {
        ContextSnapshot(
            date: date,
            scenario: scenario.normalizedForDemo,
            weather: weather,
            fortune: fortune,
            inspiration: inspiration
        )
    }
}

extension RecommendationResponse {
    var normalizedForDemo: RecommendationResponse {
        RecommendationResponse(
            context: context.normalizedForDemo,
            outfits: outfits,
            warnings: warnings
        )
    }
}

enum PreviewFixtures {
    static let wardrobe: [WardrobeItem] = [
        WardrobeItem(
            id: "shirt-oxford-ivory",
            name: "象牙白牛津衬衫",
            category: .top,
            colors: ["ivory", "cream"],
            seasons: ["spring", "autumn"],
            formality: 4.5,
            warmth: 2.2,
            tags: ["office", "commute", "tailored"],
            imageUrl: "https://placehold.co/640x800/EEE6DA/2A2E35?text=Ivory+Oxford",
            metadata: nil
        ),
        WardrobeItem(
            id: "blazer-navy-relaxed",
            name: "海军蓝宽松西装外套",
            category: .outerwear,
            colors: ["navy"],
            seasons: ["spring", "autumn"],
            formality: 4.7,
            warmth: 3.0,
            tags: ["office", "meeting", "layered"],
            imageUrl: "https://placehold.co/640x800/33435C/F2E9DD?text=Navy+Blazer",
            metadata: nil
        ),
        WardrobeItem(
            id: "trouser-charcoal-wide",
            name: "炭灰阔腿西裤",
            category: .bottom,
            colors: ["charcoal"],
            seasons: ["spring", "autumn", "winter"],
            formality: 4.6,
            warmth: 2.8,
            tags: ["office", "tailored", "boardroom"],
            imageUrl: "https://placehold.co/640x800/D8D8D8/1F2430?text=Charcoal+Trouser",
            metadata: nil
        ),
        WardrobeItem(
            id: "dress-slip-olive",
            name: "橄榄绿缎面吊带裙",
            category: .dress,
            colors: ["olive"],
            seasons: ["spring", "summer", "autumn"],
            formality: 3.7,
            warmth: 1.8,
            tags: ["date", "gallery", "sleek"],
            imageUrl: "https://placehold.co/640x800/768060/F8F3E8?text=Olive+Slip+Dress",
            metadata: nil
        ),
        WardrobeItem(
            id: "loafer-black-soft",
            name: "软面黑色乐福鞋",
            category: .shoes,
            colors: ["black"],
            seasons: ["spring", "autumn", "winter"],
            formality: 4.2,
            warmth: 2.4,
            tags: ["office", "commute", "rain-ready"],
            imageUrl: "https://placehold.co/640x800/282828/F4F0E8?text=Black+Loafer",
            metadata: nil
        ),
        WardrobeItem(
            id: "heel-slingback-cream",
            name: "奶油色后空高跟鞋",
            category: .shoes,
            colors: ["cream"],
            seasons: ["spring", "summer", "autumn"],
            formality: 4.1,
            warmth: 1.2,
            tags: ["date", "dressy"],
            imageUrl: "https://placehold.co/640x800/F0E4D8/2F2A29?text=Cream+Slingback",
            metadata: nil
        ),
        WardrobeItem(
            id: "bag-structured-olive",
            name: "橄榄绿通勤托特包",
            category: .accessory,
            colors: ["olive"],
            seasons: ["spring", "autumn", "winter"],
            formality: 4.3,
            warmth: 2.0,
            tags: ["office", "commute", "practical"],
            imageUrl: "https://placehold.co/640x800/55624A/F9F3E7?text=Olive+Tote",
            metadata: nil
        )
    ]

    static func scenarios() -> [CalendarScenario] {
        let calendar = Calendar.current
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date()) ?? Date()

        func makeScenario(
            id: String,
            title: String,
            startHour: Int,
            endHour: Int,
            location: String,
            tags: [String]
        ) -> CalendarScenario {
            let start = calendar.date(
                bySettingHour: startHour,
                minute: 0,
                second: 0,
                of: tomorrow
            ) ?? tomorrow
            let end = calendar.date(
                bySettingHour: endHour,
                minute: 30,
                second: 0,
                of: tomorrow
            ) ?? tomorrow.addingTimeInterval(3600)

            return CalendarScenario(
                id: id,
                title: title,
                startTime: start,
                endTime: end,
                location: location,
                occasionTags: tags
            )
        }

        return [
            makeScenario(
                id: "commute-atelier",
                title: "工作室通勤和咖啡碰头",
                startHour: 9,
                endHour: 17,
                location: "静安工作室",
                tags: ["commute", "creative", "coffee", "office"]
            ),
            makeScenario(
                id: "client-rainy",
                title: "市中心客户工作坊",
                startHour: 10,
                endHour: 18,
                location: "徐汇客户办公室",
                tags: ["office", "client", "meeting", "boardroom"]
            ),
            makeScenario(
                id: "date-gallery",
                title: "下班后约会和看展",
                startHour: 19,
                endHour: 22,
                location: "新天地",
                tags: ["date", "gallery", "dinner", "after-hours"]
            )
        ]
    }

    static func response(
        city: CityPreset,
        sign: ZodiacSign,
        scenario: CalendarScenario
    ) -> RecommendationResponse {
        let weather = WeatherSnapshot(
            date: tomorrowISODate(),
            highC: city.id == "london" ? 14 : city.id == "san-francisco" ? 18 : 21,
            lowC: city.id == "london" ? 7 : city.id == "san-francisco" ? 11 : 14,
            apparentHighC: city.id == "tokyo" ? 19 : 20,
            apparentLowC: city.id == "tokyo" ? 13 : 12,
            precipitationProbability: city.id == "shanghai" ? 68 : 22,
            weatherCode: city.id == "shanghai" ? 63 : 2,
            summary: city.id == "shanghai" ? "阵雨贯穿全天，空气偏凉。" : "云层轻覆，偶有放晴。",
            isRainLikely: city.id == "shanghai",
            styleTags: city.id == "shanghai" ? ["rainy", "cool", "layered"] : ["mild", "clean-lines"]
        )

        let fortune = FortuneSnapshot(
            sign: sign,
            summary: "\(sign.displayName)明天适合用一个稳定的颜色重点，让整体线条更利落。",
            luckyColor: sign == .aries || sign == .leo ? "olive" : "ink",
            mood: sign == .pisces ? "dreamy" : "steady",
            focus: sign == .virgo ? "clarity" : "confidence",
            energy: sign == .aquarius ? "late afternoon" : "midday"
        )

        let inspiration: [InspirationItem] = [
            InspirationItem(
                id: "xhs-rain-commute",
                title: "雨天利落通勤",
                sourceName: "小红书整理灵感",
                sourceUrl: "https://www.xiaohongshu.com/",
                summary: "西装外套、稳重配色和防雨鞋型，让整体在雨天也显得很利落。",
                weatherTags: ["rainy", "cool"],
                occasionTags: ["office", "commute"],
                palette: ["olive", "charcoal", "navy"],
                formality: 4.4,
                warmth: 2.8,
                vibe: "polished",
                keywords: ["tailored", "practical", "layered"]
            ),
            InspirationItem(
                id: "xhs-gallery-night",
                title: "夜间看展极简感",
                sourceName: "小红书整理灵感",
                sourceUrl: "https://www.xiaohongshu.com/",
                summary: "吊带裙、干净鞋型和克制配饰，会让整体安静但有记忆点。",
                weatherTags: ["mild", "warm"],
                occasionTags: ["date", "gallery"],
                palette: ["olive", "cream"],
                formality: 3.8,
                warmth: 1.5,
                vibe: "sleek",
                keywords: ["sleek", "minimal", "quiet-luxury"]
            )
        ]

        let outfits: [OutfitRecommendation] = [
            OutfitRecommendation(
                id: "mock-look-1",
                itemIds: [
                    "shirt-oxford-ivory",
                    "trouser-charcoal-wide",
                    "loafer-black-soft",
                    "blazer-navy-relaxed",
                    "bag-structured-olive"
                ],
                summary: "用清晰层次把明天先整理好，出门就已经很完整。",
                whyWeatherFit: "西装外套和乐福鞋能应对偏凉和小雨，保留足够覆盖度。",
                whyScenarioFit: "\(scenario.title)需要利落但不过分正式，这组比例刚好合适。",
                whyFortuneFit: "橄榄绿托特包把幸运色放在一个克制的位置，亮点很自然。",
                inspirationIds: ["xhs-rain-commute"]
            ),
            OutfitRecommendation(
                id: "mock-look-2",
                itemIds: [
                    "dress-slip-olive",
                    "heel-slingback-cream",
                    "bag-structured-olive"
                ],
                summary: "想让造型自己说话时，这套会更轻盈也更有存在感。",
                whyWeatherFit: "下午回温后，这种更轻的线条不会显得闷，也保留了呼吸感。",
                whyScenarioFit: "看展或晚餐都适合这种干净的线条，精致但不费力。",
                whyFortuneFit: "橄榄绿连衣裙直接把幸运色变成主角，气质会更完整。",
                inspirationIds: ["xhs-gallery-night"]
            ),
            OutfitRecommendation(
                id: "mock-look-3",
                itemIds: [
                    "shirt-oxford-ivory",
                    "trouser-charcoal-wide",
                    "loafer-black-soft",
                    "bag-structured-olive"
                ],
                summary: "这是更轻简的版本，干净、快速，但依然很稳。",
                whyWeatherFit: "早晚偏凉时覆盖度足够，到了下午也不会因为层次太多而显得厚重。",
                whyScenarioFit: "衬衫加西裤对工作场景足够可信，下班继续去喝咖啡或吃饭也不会突兀。",
                whyFortuneFit: "橄榄绿托特包把运势提示收成一个清晰锚点，点到为止。",
                inspirationIds: ["xhs-rain-commute"]
            )
        ]

        return RecommendationResponse(
            context: ContextSnapshot(
                date: tomorrowISODate(),
                scenario: scenario,
                weather: weather,
                fortune: fortune,
                inspiration: inspiration
            ),
            outfits: outfits,
            warnings: []
        )
    }

    static func tomorrowISODate() -> String {
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        return ISO8601DateFormatter().string(from: tomorrow).prefix(10).description
    }
}
