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

enum LookDay: String, CaseIterable, Identifiable, Hashable {
    case today
    case tomorrow

    var id: String { rawValue }

    var title: String {
        switch self {
        case .today:
            "今天"
        case .tomorrow:
            "明天"
        }
    }

    var baseDate: Date {
        let calendar = Calendar.current
        switch self {
        case .today:
            return Date()
        case .tomorrow:
            return calendar.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        }
    }

    var isoDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.string(from: baseDate)
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

    func shifted(to day: LookDay) -> CalendarScenario {
        let calendar = Calendar.current
        let targetDate = day.baseDate

        let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
        let endComponents = calendar.dateComponents([.hour, .minute], from: endTime)

        let nextStart = calendar.date(
            bySettingHour: startComponents.hour ?? 9,
            minute: startComponents.minute ?? 0,
            second: 0,
            of: targetDate
        ) ?? targetDate

        let nextEnd = calendar.date(
            bySettingHour: endComponents.hour ?? 18,
            minute: endComponents.minute ?? 0,
            second: 0,
            of: targetDate
        ) ?? nextStart.addingTimeInterval(60 * 60)

        return CalendarScenario(
            id: id,
            title: title,
            startTime: nextStart,
            endTime: max(nextEnd, nextStart.addingTimeInterval(30 * 60)),
            location: location,
            occasionTags: occasionTags
        ).normalizedForDemo
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
        LookDay.tomorrow.isoDate
    }
}

struct CuratedHomeLook {
    let day: LookDay
    let scenarioID: String
    let outfit: OutfitRecommendation
    let portraitFileName: String
}

enum CuratedHomeFixtures {
    static let looks: [CuratedHomeLook] = [
        CuratedHomeLook(
            day: .today,
            scenarioID: "client-rainy",
            outfit: OutfitRecommendation(
                id: "today-client-rainy",
                itemIds: [
                    "silk-shirt-ivory-25",
                    "wide-trouser-black-44",
                    "leather-loafer-black-49",
                    "belted-blazer-charcoal-47",
                    "structured-bag-camel-34"
                ],
                summary: "黑白灰客户线条",
                whyWeatherFit: "真丝衬衫和黑色阔腿西裤把体感控制在轻盈范围，炭灰西装外套又能把室内空调温差稳住。",
                whyScenarioFit: "客户场景更需要可信度和边界感，这套的结构线条清楚、色块稳定，开场就很有分寸。",
                whyFortuneFit: "今天的好运更适合藏在线条和节奏里，驼色托特包把重点压在一个专业又耐看的位置。",
                inspirationIds: ["client-tailored", "city-neutral"]
            ),
            portraitFileName: "today-client-rainy.png"
        ),
        CuratedHomeLook(
            day: .today,
            scenarioID: "commute-atelier",
            outfit: OutfitRecommendation(
                id: "today-commute-atelier",
                itemIds: [
                    "rib-knit-tee-oat-08",
                    "straight-denim-ink-52",
                    "minimal-sneaker-stone-54",
                    "short-trench-stone-30",
                    "shoulder-bag-taupe-15"
                ],
                summary: "轻松通勤层次",
                whyWeatherFit: "针织上衣和短风衣把早晚的微凉处理得刚好，不厚重，也不会显得太单薄。",
                whyScenarioFit: "通勤和咖啡碰头都需要松弛但干净，这组牛仔裤和运动鞋的比例会更有呼吸感。",
                whyFortuneFit: "今天适合把节奏放轻一点，灰调和鼠尾草色鞋面让整体显得平静又有细节。",
                inspirationIds: ["commute-soft", "studio-casual"]
            ),
            portraitFileName: "today-commute-atelier.png"
        ),
        CuratedHomeLook(
            day: .today,
            scenarioID: "date-gallery",
            outfit: OutfitRecommendation(
                id: "today-date-gallery",
                itemIds: [
                    "merino-knit-wine-38",
                    "a-line-midi-skirt-cream-58",
                    "slingback-heel-wine-35",
                    "wool-coat-mocha-51",
                    "pearl-earring-gold-50"
                ],
                summary: "柔和约会酒红调",
                whyWeatherFit: "羊毛针织衫和摩卡色大衣能把傍晚的凉意接住，奶油色半裙又让整体保留轻盈感。",
                whyScenarioFit: "约会和看展更适合这种柔一点的对比，酒红上衣和后空高跟鞋会让气质更有记忆点。",
                whyFortuneFit: "今天适合把亮点放近脸部，珍珠耳饰和酒红色上衣能把状态衬得更温柔也更聚焦。",
                inspirationIds: ["date-soft-contrast", "gallery-warm-light"]
            ),
            portraitFileName: "today-date-gallery.png"
        ),
        CuratedHomeLook(
            day: .tomorrow,
            scenarioID: "client-rainy",
            outfit: OutfitRecommendation(
                id: "tomorrow-client-rainy",
                itemIds: [
                    "silk-shirt-sage-31",
                    "wide-trouser-taupe-14",
                    "leather-loafer-wine-12",
                    "belted-blazer-navy-36",
                    "fine-chain-necklace-gold-57"
                ],
                summary: "知性客户鼠尾草调",
                whyWeatherFit: "鼠尾草衬衫和灰褐西裤在偏温和的天气里看起来更清爽，海军蓝西装也足够应对正式室内场合。",
                whyScenarioFit: "明天的客户场景更适合冷静一点的层次，这组色调比纯黑白更柔和，但仍然非常专业。",
                whyFortuneFit: "双子座明天更适合用清爽色提气，鼠尾草衬衫和金色细链会让整个人显得更聪明、更有回应感。",
                inspirationIds: ["client-sage", "refined-boardroom"]
            ),
            portraitFileName: "tomorrow-client-rainy.png"
        ),
        CuratedHomeLook(
            day: .tomorrow,
            scenarioID: "commute-atelier",
            outfit: OutfitRecommendation(
                id: "tomorrow-commute-atelier",
                itemIds: [
                    "merino-knit-charcoal-07",
                    "straight-denim-charcoal-23",
                    "ankle-boot-charcoal-11",
                    "short-trench-olive-42",
                    "slim-belt-camel-21"
                ],
                summary: "深色通勤都市感",
                whyWeatherFit: "炭灰针织和短靴把早晚温差处理得很稳，橄榄绿短风衣让整体在户外也不会显得沉闷。",
                whyScenarioFit: "通勤路线里这套更有都市感，深色牛仔和短靴会让走路、换场景都更利落。",
                whyFortuneFit: "明天更适合把重点收在轮廓上，细皮带和深色层次会让状态更集中，不会散掉。",
                inspirationIds: ["commute-urban", "dark-layered"]
            ),
            portraitFileName: "tomorrow-commute-atelier.png"
        ),
        CuratedHomeLook(
            day: .tomorrow,
            scenarioID: "date-gallery",
            outfit: OutfitRecommendation(
                id: "tomorrow-date-gallery",
                itemIds: [
                    "rib-knit-tee-stone-22",
                    "a-line-midi-skirt-dusty-rose-18",
                    "slingback-heel-dusty-rose-05",
                    "wool-coat-camel-24",
                    "baguette-bag-cream-37"
                ],
                summary: "浅粉约会轻优雅",
                whyWeatherFit: "石灰色针织上衣和驼色大衣能把夜里的风挡住，雾粉色裙装也不会显得太轻飘。",
                whyScenarioFit: "约会和看展更适合这种浅色轻优雅路线，A 字裙和后空高跟鞋会让步态很好看。",
                whyFortuneFit: "明天的提示更适合把温柔感往前放，雾粉色半裙和奶油白腋下包能把气氛托得更顺。",
                inspirationIds: ["date-soft-rose", "gallery-feminine"]
            ),
            portraitFileName: "tomorrow-date-gallery.png"
        )
    ]

    static func scenarios() -> [CalendarScenario] {
        PreviewFixtures.scenarios().map(\.normalizedForDemo)
    }

    static func wardrobeItems(fallback: [WardrobeItem]) -> [WardrobeItem] {
        fallback
    }

    static func context(
        for day: LookDay,
        scenario: CalendarScenario,
        sign: ZodiacSign
    ) -> ContextSnapshot {
        ContextSnapshot(
            date: day.isoDate,
            scenario: scenario,
            weather: weather(for: day),
            fortune: fortune(for: sign, day: day),
            inspiration: inspirationFeed
        )
    }

    private static func weather(for day: LookDay) -> WeatherSnapshot {
        switch day {
        case .today:
            WeatherSnapshot(
                date: day.isoDate,
                highC: 20,
                lowC: 13,
                apparentHighC: 21,
                apparentLowC: 12,
                precipitationProbability: 24,
                weatherCode: 3,
                summary: "云层柔和，路面微微带潮。",
                isRainLikely: false,
                styleTags: ["cloudy", "mild", "clean-lines"]
            )
        case .tomorrow:
            WeatherSnapshot(
                date: day.isoDate,
                highC: 22,
                lowC: 15,
                apparentHighC: 21,
                apparentLowC: 14,
                precipitationProbability: 18,
                weatherCode: 2,
                summary: "晚间有风，轻叠穿会更舒服。",
                isRainLikely: false,
                styleTags: ["mild", "layered", "polished"]
            )
        }
    }

    private static func fortune(for sign: ZodiacSign, day: LookDay) -> FortuneSnapshot {
        switch day {
        case .today:
            return FortuneSnapshot(
                sign: sign,
                summary: "\(sign.displayName)今天适合先把轮廓稳住，再留一个柔和亮点。",
                luckyColor: "camel",
                mood: "steady",
                focus: "clarity",
                energy: "midday"
            )
        case .tomorrow:
            return FortuneSnapshot(
                sign: sign,
                summary: "\(sign.displayName)明天适合把颜色提得轻一点，让整个人更有回应感。",
                luckyColor: "sage",
                mood: "bright",
                focus: "confidence",
                energy: "late afternoon"
            )
        }
    }

    private static let inspirationFeed: [InspirationItem] = [
        InspirationItem(
            id: "client-tailored",
            title: "客户场合的干净线条",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "西装、衬衫和稳定色块会让第一眼更可信。",
            weatherTags: ["mild", "cloudy"],
            occasionTags: ["client", "office"],
            palette: ["charcoal", "black", "sage"],
            formality: 4.6,
            warmth: 2.8,
            vibe: "tailored",
            keywords: ["clean", "sharp", "professional"]
        ),
        InspirationItem(
            id: "commute-soft",
            title: "通勤里的松弛层次",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "牛仔、针织和轻外套可以让日常更有呼吸感。",
            weatherTags: ["mild", "layered"],
            occasionTags: ["commute", "coffee"],
            palette: ["stone", "olive", "ink"],
            formality: 3.5,
            warmth: 2.4,
            vibe: "relaxed",
            keywords: ["casual", "layered", "urban"]
        ),
        InspirationItem(
            id: "date-soft-contrast",
            title: "约会里的柔和对比",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "轻盈裙装、温柔色差和精致鞋型最容易出状态。",
            weatherTags: ["mild", "evening"],
            occasionTags: ["date", "gallery"],
            palette: ["rose", "cream", "wine"],
            formality: 4.0,
            warmth: 2.2,
            vibe: "romantic",
            keywords: ["soft", "feminine", "polished"]
        ),
        InspirationItem(
            id: "city-neutral",
            title: "都市中性色提案",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "黑白灰和驼色配件能让整体更耐看。",
            weatherTags: ["cloudy"],
            occasionTags: ["client", "commute"],
            palette: ["black", "charcoal", "camel"],
            formality: 4.3,
            warmth: 2.6,
            vibe: "minimal",
            keywords: ["neutral", "city", "sharp"]
        ),
        InspirationItem(
            id: "date-soft-rose",
            title: "浅粉和奶油白的约会感",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "浅粉半裙和奶油白包会让气质显得更轻更亮。",
            weatherTags: ["mild"],
            occasionTags: ["date", "dinner"],
            palette: ["rose", "cream", "camel"],
            formality: 3.9,
            warmth: 2.1,
            vibe: "gentle",
            keywords: ["soft", "light", "romantic"]
        ),
        InspirationItem(
            id: "commute-urban",
            title: "深色层次的通勤都市感",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "深色针织、牛仔和短靴会让日常更利落。",
            weatherTags: ["layered"],
            occasionTags: ["commute", "studio"],
            palette: ["charcoal", "olive", "camel"],
            formality: 3.8,
            warmth: 2.8,
            vibe: "urban",
            keywords: ["dark", "structured", "city"]
        ),
        InspirationItem(
            id: "gallery-feminine",
            title: "看展时的浅色轻优雅",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "浅色针织和 A 字裙最容易拍出松弛又精致的状态。",
            weatherTags: ["evening"],
            occasionTags: ["gallery", "date"],
            palette: ["stone", "rose", "cream"],
            formality: 3.9,
            warmth: 2.0,
            vibe: "feminine",
            keywords: ["gentle", "artful", "refined"]
        ),
        InspirationItem(
            id: "refined-boardroom",
            title: "柔和冷色的商务感",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "鼠尾草和海军蓝能让专业感更显现代。",
            weatherTags: ["mild"],
            occasionTags: ["client", "meeting"],
            palette: ["sage", "navy", "taupe"],
            formality: 4.5,
            warmth: 2.5,
            vibe: "refined",
            keywords: ["smart", "modern", "calm"]
        ),
        InspirationItem(
            id: "studio-casual",
            title: "工作室日常的轻松比例",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "轻风衣加牛仔裤，是最不费力的稳定公式。",
            weatherTags: ["cloudy", "mild"],
            occasionTags: ["commute", "coffee"],
            palette: ["stone", "ink", "taupe"],
            formality: 3.4,
            warmth: 2.3,
            vibe: "casual",
            keywords: ["easy", "light", "daily"]
        ),
        InspirationItem(
            id: "dark-layered",
            title: "深色叠穿的收束感",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "同色深浅变化会让线条更整洁。",
            weatherTags: ["layered"],
            occasionTags: ["commute", "city"],
            palette: ["charcoal", "olive"],
            formality: 3.7,
            warmth: 3.0,
            vibe: "clean",
            keywords: ["dark", "layered", "sleek"]
        ),
        InspirationItem(
            id: "gallery-warm-light",
            title: "暖光环境里的酒红重点",
            sourceName: "本地精选灵感",
            sourceUrl: "https://www.xiaohongshu.com/",
            summary: "酒红色在暖光里会显得更温柔也更有质感。",
            weatherTags: ["evening"],
            occasionTags: ["date", "gallery"],
            palette: ["wine", "cream", "mocha"],
            formality: 4.1,
            warmth: 2.4,
            vibe: "warm",
            keywords: ["wine", "soft", "evening"]
        )
    ]
}
