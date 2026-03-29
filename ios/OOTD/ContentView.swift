import SwiftUI
import UIKit

struct ContentView: View {
    @ObservedObject var model: AppModel
    @State private var selectedSection: RootSection = .home
    @State private var selectedDay: LookDay = .today
    @State private var isPresentingPublishFlow = false

    var body: some View {
        ZStack {
            LookTheme.background.ignoresSafeArea()

            Group {
                switch selectedSection {
                case .home:
                    HomeFeedView(
                        model: model,
                        selectedDay: $selectedDay,
                        looks: looksForSelectedDay,
                        onPublishTap: { isPresentingPublishFlow = true }
                    )
                case .wardrobe:
                    WardrobeGallery(model: model) {
                        selectedSection = .home
                    }
                case .profile:
                    ProfileDashboard(
                        model: model
                    ) {
                        selectedSection = .home
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            BottomDock(
                selectedSection: $selectedSection,
                onPublishTap: { isPresentingPublishFlow = true }
            )
        }
        .fullScreenCover(isPresented: $isPresentingPublishFlow) {
            PublishFlowSheet(
                model: model,
                selectedDay: selectedDay,
                featuredLook: looksForSelectedDay.first
            )
        }
        .tint(LookTheme.ink)
    }

    private var looksForSelectedDay: [OutfitRecommendation] {
        guard !model.looks.isEmpty else { return [] }
        guard selectedDay == .tomorrow, model.looks.count > 1 else { return model.looks }

        return Array(model.looks.dropFirst()) + [model.looks[0]]
    }
}

private enum RootSection {
    case home
    case wardrobe
    case profile
}

private enum LookDay: String, CaseIterable, Identifiable {
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

    var subtitle: String {
        switch self {
        case .today:
            "今天先这样穿"
        case .tomorrow:
            "明天提前想好"
        }
    }
}

private enum PublishStage {
    case camera
    case share
}

private enum PublishDestination: String, CaseIterable, Identifiable {
    case xiaohongshu
    case wechat

    var id: String { rawValue }

    var title: String {
        switch self {
        case .xiaohongshu:
            "小红书"
        case .wechat:
            "微信"
        }
    }

    var symbolName: String {
        switch self {
        case .xiaohongshu:
            "book.closed"
        case .wechat:
            "message"
        }
    }
}

private struct HomeFeedView: View {
    @ObservedObject var model: AppModel
    @Binding var selectedDay: LookDay
    let looks: [OutfitRecommendation]
    let onPublishTap: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                topBar

                if let errorMessage = model.errorMessage {
                    SurfaceCard {
                        Text(errorMessage)
                            .font(.system(.body, design: .rounded))
                            .foregroundStyle(LookTheme.ink)
                    }
                }

                if model.isBootstrapping && looks.isEmpty {
                    SurfaceCard {
                        VStack(spacing: 14) {
                            ProgressView()
                                .controlSize(.large)

                            Text("正在整理你的今日穿搭...")
                                .font(.system(.body, design: .rounded).weight(.medium))
                                .foregroundStyle(LookTheme.ink.opacity(0.76))
                        }
                        .frame(maxWidth: .infinity, minHeight: 220, alignment: .center)
                    }
                } else {
                    ForEach(Array(looks.enumerated()), id: \.element.id) { index, look in
                        OutfitFeedCard(
                            index: index,
                            look: look,
                            items: prioritizedItems(for: look),
                            portraitURLs: model.lookPortraitURLs(for: look.id),
                            isGeneratingPortraits: model.isGeneratingPortraits(for: look.id),
                            onReroll: { model.rerollLook(look.id) },
                            city: model.summaryCityText,
                            scenarioTitle: model.recommendation?.context.scenario.title ?? "今日安排"
                        )
                    }
                }

                if looks.isEmpty && !model.isBootstrapping {
                    SurfaceCard {
                        Text("还没有生成穿搭")
                            .font(.system(.title3, design: .rounded).weight(.bold))
                            .foregroundStyle(LookTheme.ink)

                        Text("去“我”里切换城市、运势和日程，再回来刷新。")
                            .font(.system(.body, design: .rounded))
                            .foregroundStyle(LookTheme.ink.opacity(0.74))
                    }
                }

            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 20)
        }
        .scrollIndicators(.hidden)
    }

    private var topBar: some View {
        VStack(alignment: .leading, spacing: 14) {
            DaySegmentedControl(selectedDay: $selectedDay)

            Text("\(formattedDate(for: selectedDay)) · \(model.summaryCityText)")
                .font(.system(.subheadline, design: .rounded).weight(.medium))
                .foregroundStyle(LookTheme.ink.opacity(0.72))
        }
    }

    private func prioritizedItems(for look: OutfitRecommendation) -> [WardrobeItem] {
        look.itemIds
            .compactMap { id in
                model.wardrobe.first(where: { $0.id == id })
            }
            .sorted { lhs, rhs in
                categoryPriority(lhs.category) < categoryPriority(rhs.category)
            }
    }

    private func categoryPriority(_ category: ClothingCategory) -> Int {
        switch category {
        case .dress:
            0
        case .top:
            1
        case .outerwear:
            2
        case .bottom:
            3
        case .shoes:
            4
        case .accessory:
            5
        }
    }
}

private struct DaySegmentedControl: View {
    @Binding var selectedDay: LookDay

    var body: some View {
        HStack(spacing: 8) {
            ForEach(LookDay.allCases) { day in
                Button {
                    selectedDay = day
                } label: {
                    Text(day.title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .foregroundStyle(selectedDay == day ? Color.white : LookTheme.ink)
                        .background(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(selectedDay == day ? LookTheme.ink : Color.white.opacity(0.58))
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityIdentifier("daySegment")
    }
}

private struct OutfitFeedCard: View {
    let index: Int
    let look: OutfitRecommendation
    let items: [WardrobeItem]
    let portraitURLs: [URL]
    let isGeneratingPortraits: Bool
    let onReroll: () -> Void
    let city: String
    let scenarioTitle: String
    @State private var isExpanded = false

    private var featuredItems: [WardrobeItem] {
        Array(items.prefix(3))
    }

    private var overflowCount: Int {
        max(items.count - featuredItems.count, 0)
    }

    private var visibleItems: [WardrobeItem] {
        if isExpanded {
            return items
        }

        return featuredItems
    }

    private var styleTitle: String {
        let rawPersona = items
            .compactMap { $0.metadata?.stylePersona }
            .map { $0.replacingOccurrences(of: "风", with: "") }
            .first { !$0.isEmpty }

        let base = rawPersona ?? fallbackStyleBase
        let suffix: String

        if items.contains(where: { $0.category == .dress }) {
            suffix = "裙装"
        } else if items.contains(where: { $0.category == .outerwear }) {
            suffix = "叠穿"
        } else if items.contains(where: { $0.category == .bottom }) {
            suffix = "通勤"
        } else {
            suffix = "轻搭"
        }

        return "\(base)\(suffix)"
    }

    private var fallbackStyleBase: String {
        if items.contains(where: { $0.category == .dress }) {
            return "轻盈"
        }

        if items.contains(where: { $0.category == .outerwear }) {
            return "知性"
        }

        return "利落"
    }

    var body: some View {
        SurfaceCard {
            HStack(alignment: .top, spacing: 16) {
                VStack(spacing: 10) {
                    ForEach(visibleItems, id: \.id) { item in
                        OutfitItemMiniCard(item: item)
                    }

                    if overflowCount > 0 {
                        Button {
                            withAnimation(.spring(response: 0.26, dampingFraction: 0.82)) {
                                isExpanded.toggle()
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Text(isExpanded ? "收起" : "+\(overflowCount) 件")
                                Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 11, weight: .bold))
                            }
                            .font(.system(.caption, design: .rounded).weight(.bold))
                            .foregroundStyle(LookTheme.ink.opacity(0.72))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .fill(Color.white.opacity(0.52))
                            )
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("lookExpandButton_\(index)")
                    }
                }
                .frame(width: 98)

                VStack(alignment: .leading, spacing: 12) {
                    LookPortraitPanel(
                        portraitURLs: portraitURLs,
                        fallbackItems: items,
                        isGenerating: isGeneratingPortraits,
                        onReroll: onReroll
                    )
                        .frame(height: 230)
                        .accessibilityIdentifier("lookPortrait_\(index)")

                    Text(styleTitle)
                        .font(.system(.title3, design: .serif).weight(.bold))
                        .foregroundStyle(LookTheme.ink)
                        .accessibilityIdentifier("lookTitle_\(index)")

                    Text("\(city) · \(scenarioTitle)")
                        .font(.system(.subheadline, design: .rounded).weight(.medium))
                        .foregroundStyle(LookTheme.ink.opacity(0.72))

                    VStack(alignment: .leading, spacing: 8) {
                        explanationCard(title: "天气", icon: "cloud.sun.fill", value: look.whyWeatherFit)
                        explanationCard(title: "场景", icon: "calendar", value: look.whyScenarioFit)
                        explanationCard(title: "运势", icon: "sparkles", value: look.whyFortuneFit)
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lookCard_\(index)")
    }

    private func explanationCard(title: String, icon: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(LookTheme.clay)

                Text(title)
                    .font(.system(.caption, design: .rounded).weight(.bold))
                    .foregroundStyle(LookTheme.clay)
            }

            Text(value)
                .font(.system(.footnote, design: .rounded))
                .foregroundStyle(LookTheme.ink.opacity(0.84))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.48))
        )
    }
}

private struct LookPortraitPanel: View {
    let portraitURLs: [URL]
    let fallbackItems: [WardrobeItem]
    let isGenerating: Bool
    let onReroll: () -> Void
    @State private var showsAction = false

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if let portraitURL = portraitURLs.first {
                    AsyncImage(url: portraitURL) { phase in
                        switch phase {
                        case let .success(image):
                            image
                                .resizable()
                                .scaledToFill()
                        default:
                            OutfitPortraitView(items: fallbackItems)
                        }
                    }
                } else {
                    OutfitPortraitView(items: fallbackItems)
                }
            }

            if showsAction && !isGenerating {
                Button(action: onReroll) {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles.rectangle.stack")
                            .font(.system(size: 12, weight: .bold))
                        Text("重新搭配")
                            .font(.system(.caption, design: .rounded).weight(.bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(
                        Capsule(style: .continuous)
                            .fill(Color.black.opacity(0.62))
                    )
                }
                .buttonStyle(.plain)
                .padding(14)
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            if isGenerating {
                AIGeneratingOverlay()
                    .transition(.opacity)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .onTapGesture {
            guard !isGenerating else { return }
            withAnimation(.spring(response: 0.28, dampingFraction: 0.84)) {
                showsAction.toggle()
            }
        }
        .onChange(of: isGenerating) { _, newValue in
            if newValue {
                showsAction = false
            }
        }
    }
}

private struct AIGeneratingOverlay: View {
    @State private var animatePrimary = false
    @State private var animateSecondary = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    LookTheme.sand.opacity(0.92),
                    LookTheme.clay.opacity(0.72),
                    LookTheme.ink.opacity(0.62)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.12))
                        .frame(width: 96, height: 96)
                        .scaleEffect(animatePrimary ? 1.08 : 0.84)
                    Circle()
                        .stroke(Color.white.opacity(0.32), lineWidth: 1.5)
                        .frame(width: 72, height: 72)
                        .scaleEffect(animateSecondary ? 1.2 : 0.78)

                    Image(systemName: "sparkles")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: 6) {
                    Text("AI正在生成真人效果图")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(.white)
                }

                HStack(spacing: 8) {
                    ForEach(0..<3, id: \.self) { index in
                        Capsule(style: .continuous)
                            .fill(Color.white.opacity(0.88))
                            .frame(width: animatePrimary ? 24 : 12, height: 6)
                            .opacity(animatePrimary ? 0.92 : 0.36)
                            .animation(
                                .easeInOut(duration: 0.9)
                                    .repeatForever(autoreverses: true)
                                    .delay(Double(index) * 0.12),
                                value: animatePrimary
                            )
                    }
                }
            }
            .padding(24)
        }
        .onAppear {
            animatePrimary = true
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                animateSecondary.toggle()
            }
        }
    }
}

private struct OutfitItemMiniCard: View {
    let item: WardrobeItem

    var body: some View {
        WardrobeThumbnail(item: item, showsTag: false)
            .frame(height: 86)
            .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.56))
        )
    }
}

private struct OutfitPortraitView: View {
    let items: [WardrobeItem]

    private var dressItem: WardrobeItem? {
        items.first(where: { $0.category == .dress })
    }

    private var topItem: WardrobeItem? {
        items.first(where: { $0.category == .top })
    }

    private var outerwearItem: WardrobeItem? {
        items.first(where: { $0.category == .outerwear })
    }

    private var bottomItem: WardrobeItem? {
        items.first(where: { $0.category == .bottom })
    }

    private var shoeItem: WardrobeItem? {
        items.first(where: { $0.category == .shoes })
    }

    private var bagItem: WardrobeItem? {
        items.first(where: { item in
            item.category == .accessory &&
                (item.metadata?.subcategory.contains("包") == true || item.tags.contains("bag"))
        })
    }

    private var accessoryItem: WardrobeItem? {
        items.first(where: { $0.category == .accessory })
    }

    private var dressColor: Color {
        wardrobeColor(from: dressItem?.colors.first)
    }

    private var topColor: Color {
        wardrobeColor(from: topItem?.colors.first)
    }

    private var bottomColor: Color {
        wardrobeColor(from: bottomItem?.colors.first)
    }

    private var outerwearColor: Color {
        wardrobeColor(from: outerwearItem?.colors.first)
    }

    private var shoeColor: Color {
        wardrobeColor(from: shoeItem?.colors.first, fallback: LookTheme.ink)
    }

    private var accessoryColor: Color {
        wardrobeColor(from: (bagItem ?? accessoryItem)?.colors.first, fallback: LookTheme.clay)
    }

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            let centerX = size.width * 0.55
            let baselineY = size.height * 0.86

            ZStack {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.72),
                                Color(red: 0.97, green: 0.93, blue: 0.88).opacity(0.92)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.6), lineWidth: 1)

                Circle()
                    .fill(Color(red: 0.94, green: 0.86, blue: 0.80).opacity(0.35))
                    .frame(width: size.width * 0.78, height: size.width * 0.78)
                    .offset(x: size.width * 0.12, y: -size.height * 0.14)

                Ellipse()
                    .fill(LookTheme.ink.opacity(0.10))
                    .frame(width: size.width * 0.34, height: 16)
                    .offset(x: size.width * 0.08, y: size.height * 0.34)

                Capsule()
                    .fill(Color(red: 0.18, green: 0.15, blue: 0.15))
                    .frame(width: size.width * 0.22, height: size.height * 0.23)
                    .offset(x: size.width * 0.08, y: -size.height * 0.22)

                Circle()
                    .fill(Color(red: 0.95, green: 0.83, blue: 0.75))
                    .frame(width: size.width * 0.14, height: size.width * 0.14)
                    .offset(x: size.width * 0.08, y: -size.height * 0.23)

                if dressItem != nil {
                    DressShape()
                        .fill(dressColor)
                        .frame(width: size.width * 0.30, height: size.height * 0.40)
                        .offset(x: size.width * 0.08, y: -size.height * 0.03)
                } else {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(topColor)
                        .frame(width: size.width * 0.20, height: size.height * 0.18)
                        .offset(x: size.width * 0.08, y: -size.height * 0.05)

                    if let bottomItem {
                        switch bottomItem.metadata?.subcategory {
                        case let value where value?.contains("裙") == true:
                            SkirtShape()
                                .fill(bottomColor)
                                .frame(width: size.width * 0.26, height: size.height * 0.24)
                                .offset(x: size.width * 0.08, y: size.height * 0.12)
                        default:
                            HStack(spacing: size.width * 0.04) {
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(bottomColor)
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(bottomColor)
                            }
                            .frame(width: size.width * 0.20, height: size.height * 0.28)
                            .offset(x: size.width * 0.08, y: size.height * 0.13)
                        }
                    }
                }

                if outerwearItem != nil {
                    OpenCoatShape()
                        .fill(outerwearColor.opacity(0.95))
                        .frame(width: size.width * 0.38, height: size.height * 0.42)
                        .offset(x: size.width * 0.08, y: 0)
                }

                Group {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(red: 0.95, green: 0.83, blue: 0.75))
                        .frame(width: size.width * 0.04, height: size.height * 0.18)
                        .rotationEffect(.degrees(10))
                        .offset(x: -size.width * 0.06, y: -size.height * 0.02)

                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(red: 0.95, green: 0.83, blue: 0.75))
                        .frame(width: size.width * 0.04, height: size.height * 0.18)
                        .rotationEffect(.degrees(-12))
                        .offset(x: size.width * 0.22, y: -size.height * 0.02)

                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(red: 0.95, green: 0.83, blue: 0.75))
                        .frame(width: size.width * 0.05, height: size.height * 0.24)
                        .rotationEffect(.degrees(5))
                        .offset(x: size.width * 0.04, y: size.height * 0.22)

                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(red: 0.95, green: 0.83, blue: 0.75))
                        .frame(width: size.width * 0.05, height: size.height * 0.24)
                        .rotationEffect(.degrees(-5))
                        .offset(x: size.width * 0.12, y: size.height * 0.22)
                }

                HStack(spacing: size.width * 0.05) {
                    Capsule()
                        .fill(shoeColor)
                    Capsule()
                        .fill(shoeColor)
                }
                .frame(width: size.width * 0.18, height: 14)
                .position(x: centerX, y: baselineY)

                if bagItem != nil {
                    VStack(spacing: 2) {
                        Capsule()
                            .stroke(accessoryColor, lineWidth: 3)
                            .frame(width: size.width * 0.08, height: size.height * 0.06)
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(accessoryColor)
                            .frame(width: size.width * 0.12, height: size.height * 0.16)
                    }
                    .offset(x: size.width * 0.27, y: size.height * 0.05)
                } else if accessoryItem != nil {
                    Circle()
                        .stroke(accessoryColor, lineWidth: 3)
                        .frame(width: 14, height: 14)
                        .offset(x: size.width * 0.24, y: -size.height * 0.02)
                }
            }
        }
    }

    private func wardrobeColor(from raw: String?, fallback: Color = LookTheme.sand) -> Color {
        switch raw?.lowercased() {
        case "black", "ink":
            return LookTheme.ink
        case "charcoal":
            return Color(red: 0.28, green: 0.30, blue: 0.34)
        case "navy":
            return Color(red: 0.21, green: 0.29, blue: 0.43)
        case "olive":
            return Color(red: 0.48, green: 0.54, blue: 0.33)
        case "cream":
            return Color(red: 0.94, green: 0.90, blue: 0.83)
        case "ivory":
            return Color(red: 0.96, green: 0.93, blue: 0.86)
        case "stone":
            return Color(red: 0.77, green: 0.73, blue: 0.67)
        case "taupe":
            return Color(red: 0.67, green: 0.60, blue: 0.55)
        case "camel":
            return Color(red: 0.74, green: 0.60, blue: 0.40)
        case "mocha", "espresso":
            return Color(red: 0.45, green: 0.32, blue: 0.25)
        case "sage":
            return Color(red: 0.67, green: 0.74, blue: 0.66)
        case "wine":
            return Color(red: 0.46, green: 0.16, blue: 0.20)
        case "white", "pearl":
            return Color.white
        case "gold":
            return Color(red: 0.80, green: 0.65, blue: 0.27)
        case "silver":
            return Color(red: 0.76, green: 0.78, blue: 0.81)
        default:
            return fallback
        }
    }
}

private struct BottomDock: View {
    @Binding var selectedSection: RootSection
    let onPublishTap: () -> Void

    var body: some View {
        HStack(alignment: .bottom, spacing: 18) {
            dockButton(
                title: "衣橱",
                systemImage: "hanger",
                isActive: selectedSection == .wardrobe
            ) {
                selectedSection = .wardrobe
            }

            Button {
                onPublishTap()
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(LookTheme.ink)
                        .frame(width: 76, height: 60)

                    Image(systemName: "camera")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(Color.white)
                }
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("publishDockButton")

            dockButton(
                title: "我",
                systemImage: "person",
                isActive: selectedSection == .profile
            ) {
                selectedSection = .profile
            }
        }
        .padding(.horizontal, 28)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color.white.opacity(0.92))
                .shadow(color: LookTheme.ink.opacity(0.10), radius: 22, x: 0, y: -4)
        )
        .padding(.horizontal, 18)
        .padding(.bottom, 8)
    }

    private func dockButton(
        title: String,
        systemImage: String,
        isActive: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.system(size: 22, weight: .semibold))
                Text(title)
                    .font(.system(.subheadline, design: .rounded).weight(.bold))
            }
            .foregroundStyle(isActive ? LookTheme.ink : LookTheme.ink.opacity(0.65))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

private struct WardrobeGallery: View {
    @ObservedObject var model: AppModel
    let onGoHome: () -> Void

    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 14)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                SectionHeader(title: "衣橱", subtitle: "把你已有的单品先收好。", onGoHome: onGoHome)

                LazyVGrid(columns: columns, spacing: 14) {
                    ForEach(model.wardrobe) { item in
                        SurfaceCard {
                            WardrobeThumbnail(item: item)
                                .frame(height: 156)

                            Text(item.name)
                                .font(.system(.headline, design: .rounded).weight(.bold))
                                .foregroundStyle(LookTheme.ink)

                            Text(item.category.title)
                                .font(.system(.caption, design: .rounded).weight(.semibold))
                                .foregroundStyle(LookTheme.moss)

                            if let metadata = item.metadata {
                                Text("\(metadata.subcategory) · \(metadata.stylePersona ?? metadata.styleDirection)")
                                    .font(.system(.caption2, design: .rounded))
                                    .foregroundStyle(LookTheme.ink.opacity(0.68))
                                    .lineLimit(2)
                            }

                            Text(item.colors.map(localizedColorName).joined(separator: " · "))
                                .font(.system(.caption, design: .rounded))
                                .foregroundStyle(LookTheme.ink.opacity(0.7))
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 20)
        }
        .scrollIndicators(.hidden)
    }
}

private struct ProfileDashboard: View {
    @ObservedObject var model: AppModel
    let onGoHome: () -> Void

    private let scenarioLabels: [String: String] = [
        "commute-atelier": "通勤",
        "client-rainy": "客户",
        "date-gallery": "约会"
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                SectionHeader(title: "我", subtitle: "天气、运势和日历都在这里。", onGoHome: onGoHome)

                SurfaceCard {
                    Text("天气")
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundStyle(LookTheme.ink)

                    if let weather = model.recommendation?.context.weather {
                        detailRow(title: "城市", value: model.summaryCityText)
                        detailRow(title: "体感", value: "\(Int(weather.apparentLowC))-\(Int(weather.apparentHighC))°C")
                        detailRow(title: "天气", value: weather.summary)
                        detailRow(title: "湿度", value: "48%")
                    } else {
                        Text("还没拿到天气信息。")
                            .font(.system(.body, design: .rounded))
                            .foregroundStyle(LookTheme.ink.opacity(0.72))
                    }
                }

                SurfaceCard {
                    Text("运势")
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundStyle(LookTheme.ink)

                    if let fortune = model.recommendation?.context.fortune {
                        detailRow(title: "星座", value: model.summarySignText)
                        detailRow(title: "幸运色", value: localizedColorName(fortune.luckyColor))
                        detailRow(title: "状态", value: localizedMood(fortune.mood))
                        detailRow(title: "提示", value: fortune.summary)
                    } else {
                        Text("还没拿到运势信息。")
                            .font(.system(.body, design: .rounded))
                            .foregroundStyle(LookTheme.ink.opacity(0.72))
                    }
                }

                SurfaceCard {
                    Text("日历")
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundStyle(LookTheme.ink)

                    if !model.scenarios.isEmpty {
                        Picker(
                            "场景",
                            selection: Binding(
                                get: { model.selectedScenarioID },
                                set: { model.selectScenario($0) }
                            )
                        ) {
                            ForEach(model.scenarios) { scenario in
                                Text(scenarioLabels[scenario.id] ?? scenario.title).tag(scenario.id)
                            }
                        }
                        .pickerStyle(.segmented)
                        .accessibilityIdentifier("scenarioPicker")
                    }

                    if let scenario = model.draftScenario {
                        VStack(alignment: .leading, spacing: 12) {
                            detailRow(title: "安排", value: scenario.title)
                            detailRow(title: "地点", value: scenario.location)
                            detailRow(title: "时间", value: timeRangeText(for: scenario))
                            detailRow(title: "标签", value: scenario.occasionTags.joined(separator: " · "))
                        }
                    } else {
                        Text("还没有读取到日程。")
                            .font(.system(.body, design: .rounded))
                            .foregroundStyle(LookTheme.ink.opacity(0.72))
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 20)
        }
        .scrollIndicators(.hidden)
    }

    private func detailRow(title: String, value: String) -> some View {
        HStack(alignment: .top) {
            Text(title)
                .font(.system(.caption, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.clay)
                .frame(width: 56, alignment: .leading)

            Text(value)
                .font(.system(.subheadline, design: .rounded).weight(.medium))
                .foregroundStyle(LookTheme.ink)
        }
    }
}

private struct SectionHeader: View {
    let title: String
    let subtitle: String
    let onGoHome: () -> Void

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 30, weight: .bold, design: .serif))
                    .foregroundStyle(LookTheme.ink)

                Text(subtitle)
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundStyle(LookTheme.ink.opacity(0.72))
            }

            Spacer(minLength: 12)

            Button {
                onGoHome()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left")
                    Text("返回穿搭")
                }
                .font(.system(.subheadline, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule(style: .continuous).fill(Color.white.opacity(0.58)))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("backToHomeButton")
        }
    }
}

private struct PublishFlowSheet: View {
    @ObservedObject var model: AppModel
    let selectedDay: LookDay
    let featuredLook: OutfitRecommendation?

    @Environment(\.dismiss) private var dismiss
    @State private var stage: PublishStage = .camera
    @State private var destination: PublishDestination = .xiaohongshu
    @State private var didCompleteShare = false
    @State private var capturedImage: UIImage?
    @State private var isPresentingSystemCamera = false
    @State private var hasRequestedSystemCamera = false

    private var shareCopy: String {
        guard let context = model.recommendation?.context else {
            return "今天先把这套穿搭拍下来，留作出门前的一次简洁记录。"
        }

        let weatherSummary = context.weather.summary.replacingOccurrences(of: "。", with: "")
        return "\(model.summaryCityText)今天\(Int(context.weather.lowC))-\(Int(context.weather.highC))°C，\(weatherSummary)。" +
            "日历安排是\(context.scenario.title)，地点在\(context.scenario.location)。" +
            "\(model.summarySignText)今天的提示是：\(context.fortune.summary)"
    }

    private var shouldUseSystemCamera: Bool {
        UIImagePickerController.isSourceTypeAvailable(.camera) &&
            !ProcessInfo.processInfo.arguments.contains("UITEST_MOCK")
    }

    var body: some View {
        Group {
            switch stage {
            case .camera:
                cameraStage
            case .share:
                shareStage
            }
        }
        .onAppear {
            presentSystemCameraIfNeeded()
        }
        .onChange(of: stage) { _, newValue in
            if newValue == .camera {
                presentSystemCameraIfNeeded()
            }
        }
        .onChange(of: capturedImage) { _, newValue in
            if newValue != nil {
                stage = .share
            }
        }
        .fullScreenCover(isPresented: $isPresentingSystemCamera, onDismiss: handleSystemCameraDismiss) {
            SystemCameraPicker(
                capturedImage: $capturedImage,
                isPresented: $isPresentingSystemCamera
            )
            .ignoresSafeArea()
        }
    }

    private var cameraStage: some View {
        ZStack {
            Color.black.opacity(0.97).ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(Color.white)
                            .frame(width: 40, height: 40)
                            .background(Color.white.opacity(0.12), in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("closeCameraButton")

                    Spacer()

                    Text("相机")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(Color.white.opacity(0.9))

                    Spacer()

                    Color.clear
                        .frame(width: 40, height: 40)
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)

                Spacer(minLength: 18)

                ZStack(alignment: .bottom) {
                    RoundedRectangle(cornerRadius: 34, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.08),
                                    Color.white.opacity(0.03)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 34, style: .continuous)
                                .stroke(Color.white.opacity(0.14), lineWidth: 1)
                        )

                    if let featuredLook {
                        OutfitPortraitView(items: outfitItems(for: featuredLook))
                            .frame(maxHeight: .infinity)
                            .padding(.horizontal, 18)
                            .padding(.top, 28)
                            .padding(.bottom, 32)
                    } else {
                        Image(systemName: "person.crop.rectangle")
                            .font(.system(size: 64, weight: .light))
                            .foregroundStyle(Color.white.opacity(0.8))
                    }

                    HStack {
                        Text("\(selectedDay.title)穿搭")
                            .font(.system(.subheadline, design: .rounded).weight(.bold))
                            .foregroundStyle(Color.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.black.opacity(0.24), in: Capsule())

                        Spacer()
                    }
                    .padding(18)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 560)
                .padding(.horizontal, 18)
                .accessibilityIdentifier("cameraPreview")

                Spacer(minLength: 18)

                VStack(spacing: 14) {
                    Text(shouldUseSystemCamera ? "正在打开系统相机..." : "当前设备不支持系统相机，先用演示模式继续")
                        .font(.system(.subheadline, design: .rounded).weight(.medium))
                        .foregroundStyle(Color.white.opacity(0.74))

                    Button {
                        if shouldUseSystemCamera {
                            hasRequestedSystemCamera = false
                            presentSystemCameraIfNeeded()
                        } else {
                            stage = .share
                        }
                    } label: {
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.7), lineWidth: 5)
                                .frame(width: 88, height: 88)

                            Circle()
                                .fill(Color.white)
                                .frame(width: 68, height: 68)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("captureButton")
                }
                .padding(.bottom, 26)
            }
        }
    }

    private var shareStage: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                SurfaceCard {
                    HStack(alignment: .top, spacing: 16) {
                        if let capturedImage {
                            Image(uiImage: capturedImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 150, height: 220)
                                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                        } else if let featuredLook {
                            OutfitPortraitView(items: outfitItems(for: featuredLook))
                                .frame(width: 150, height: 220)
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text(shareCopy)
                                .font(.system(.body, design: .rounded))
                                .foregroundStyle(LookTheme.ink.opacity(0.78))
                                .fixedSize(horizontal: false, vertical: true)

                            if let featuredLook {
                                Text(featuredLook.itemIds.map(model.wardrobeItemName(for:)).joined(separator: " · "))
                                    .font(.system(.footnote, design: .rounded))
                                    .foregroundStyle(LookTheme.ink.opacity(0.68))
                            }
                        }
                    }
                }

                SurfaceCard {
                    Text("发布到")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(LookTheme.ink)

                    HStack(spacing: 10) {
                        ForEach(PublishDestination.allCases) { option in
                            Button {
                                destination = option
                                didCompleteShare = false
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: option.symbolName)
                                    Text(option.title)
                                }
                                .font(.system(.subheadline, design: .rounded).weight(.bold))
                                .foregroundStyle(destination == option ? Color.white : LookTheme.ink)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                                .frame(maxWidth: .infinity)
                                .background(
                                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                                        .fill(destination == option ? LookTheme.ink : Color.white.opacity(0.6))
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    Button {
                        didCompleteShare = true
                    } label: {
                        Text("发布到\(destination.title)")
                            .font(.system(.headline, design: .rounded).weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(
                                RoundedRectangle(cornerRadius: 24, style: .continuous)
                                    .fill(LookTheme.ink)
                            )
                            .foregroundStyle(Color.white)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("fakePublishButton")

                    if didCompleteShare {
                        Text("已生成\(destination.title)发布页。")
                            .font(.system(.subheadline, design: .rounded).weight(.bold))
                            .foregroundStyle(LookTheme.moss)
                            .accessibilityIdentifier("publishSuccessLabel")
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(20)
            .background(LookTheme.background.ignoresSafeArea())
            .navigationTitle("发布")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("关闭") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func outfitItems(for look: OutfitRecommendation) -> [WardrobeItem] {
        look.itemIds.compactMap { id in
            model.wardrobe.first(where: { $0.id == id })
        }
    }

    private func presentSystemCameraIfNeeded() {
        guard stage == .camera, shouldUseSystemCamera, !hasRequestedSystemCamera else { return }
        hasRequestedSystemCamera = true
        DispatchQueue.main.async {
            isPresentingSystemCamera = true
        }
    }

    private func handleSystemCameraDismiss() {
        if capturedImage != nil {
            stage = .share
            return
        }

        if stage == .camera, shouldUseSystemCamera {
            dismiss()
        }
    }
}

private struct SystemCameraPicker: UIViewControllerRepresentable {
    @Binding var capturedImage: UIImage?
    @Binding var isPresented: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        private let parent: SystemCameraPicker

        init(_ parent: SystemCameraPicker) {
            self.parent = parent
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            parent.capturedImage = (info[.originalImage] ?? info[.editedImage]) as? UIImage
            parent.isPresented = false
        }
    }
}

private struct DressShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX * 0.82, y: rect.maxY * 0.22))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX * 0.18, y: rect.maxY * 0.22))
        path.closeSubpath()
        return path
    }
}

private struct SkirtShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.maxX * 0.28, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX * 0.72, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

private struct OpenCoatShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.maxX * 0.08, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX * 0.36, y: rect.maxY * 0.20))
        path.addLine(to: CGPoint(x: rect.maxX * 0.22, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()

        path.move(to: CGPoint(x: rect.maxX * 0.92, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX * 0.64, y: rect.maxY * 0.20))
        path.addLine(to: CGPoint(x: rect.maxX * 0.78, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

private func formattedDate(for day: LookDay) -> String {
    let calendar = Calendar.current
    let baseDate: Date

    switch day {
    case .today:
        baseDate = Date()
    case .tomorrow:
        baseDate = calendar.date(byAdding: .day, value: 1, to: Date()) ?? Date()
    }

    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "zh_CN")
    formatter.dateFormat = "M月d日 EEEE"
    return formatter.string(from: baseDate)
}

private func timeRangeText(for scenario: CalendarScenario) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "zh_CN")
    formatter.dateFormat = "M月d日 HH:mm"
    return "\(formatter.string(from: scenario.startTime)) - \(formatter.string(from: scenario.endTime))"
}

private func localizedColorName(_ raw: String) -> String {
    switch raw.lowercased() {
    case "olive":
        return "橄榄绿"
    case "ink":
        return "墨黑"
    case "cream":
        return "奶油白"
    case "pearl":
        return "珍珠白"
    case "ivory":
        return "象牙白"
    case "charcoal":
        return "炭灰"
    case "navy":
        return "海军蓝"
    case "gold":
        return "金色"
    case "silver":
        return "银色"
    case "stone":
        return "石灰色"
    case "oat":
        return "燕麦色"
    case "sage":
        return "鼠尾草绿"
    case "mocha":
        return "摩卡色"
    case "camel":
        return "驼色"
    case "indigo":
        return "靛蓝"
    case "moss":
        return "苔绿色"
    case "sand":
        return "沙色"
    case "beige":
        return "米色"
    case "taupe":
        return "灰褐色"
    case "white":
        return "白色"
    case "espresso":
        return "浓缩咖色"
    case "forest":
        return "森林绿"
    case "black":
        return "黑色"
    case "wine":
        return "酒红"
    default:
        return raw
    }
}

private func localizedMood(_ raw: String) -> String {
    switch raw.lowercased() {
    case "steady":
        return "稳定"
    case "dreamy":
        return "轻盈"
    case "grounded":
        return "沉稳"
    case "intentional":
        return "笃定"
    default:
        return raw
    }
}

private struct WardrobeThumbnail: View {
    let item: WardrobeItem
    var showsTag: Bool = true

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [LookTheme.paper, LookTheme.sand.opacity(0.85)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            if let previewURL {
                AsyncImage(url: previewURL) { phase in
                    switch phase {
                    case let .success(image):
                        image
                            .resizable()
                            .scaledToFit()
                            .padding(16)
                    default:
                        fallbackView
                    }
                }
            } else if let bundledPreviewImage {
                Image(uiImage: bundledPreviewImage)
                    .resizable()
                    .scaledToFit()
                    .padding(16)
            } else {
                fallbackView
            }
        }
        .overlay(alignment: .topLeading) {
            if showsTag {
                TagChip(text: item.category.title, filled: true)
                    .padding(10)
            }
        }
    }

    private var previewURL: URL? {
        guard bundledPreviewImage == nil else { return nil }
        let lowercasedURL = item.imageUrl.lowercased()
        let supportsRasterPreview = lowercasedURL.hasSuffix(".png") || lowercasedURL.hasSuffix(".jpg")
            || lowercasedURL.hasSuffix(".jpeg") || lowercasedURL.hasSuffix(".webp")
        guard item.metadata != nil, item.imageUrl.contains("/generated-assets/"), supportsRasterPreview else {
            return nil
        }
        return URL(string: item.imageUrl)
    }

    private var bundledPreviewImage: UIImage? {
        guard let fileName = bundledImageFileName else { return nil }
        let fileURL = Bundle.main.bundleURL
            .appending(path: "GeneratedWardrobeImages", directoryHint: .isDirectory)
            .appending(path: fileName)
        return UIImage(contentsOfFile: fileURL.path)
    }

    private var bundledImageFileName: String? {
        let fileName = URL(string: item.imageUrl)?.lastPathComponent ?? (item.imageUrl as NSString).lastPathComponent
        return fileName.isEmpty ? nil : fileName
    }

    private var fallbackView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.44))

            VStack(spacing: 10) {
                Image(systemName: item.category.symbolName)
                    .font(.system(size: 30, weight: .semibold))
                Text(item.name.components(separatedBy: " ").prefix(2).joined(separator: " "))
                    .multilineTextAlignment(.center)
                    .font(.system(.caption, design: .rounded).weight(.semibold))
            }
            .foregroundStyle(LookTheme.ink)
            .padding(18)
        }
    }
}
