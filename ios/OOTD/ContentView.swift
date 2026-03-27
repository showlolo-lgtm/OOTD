import SwiftUI

struct ContentView: View {
    @ObservedObject var model: AppModel
    @State private var isPresentingSettings = false

    var body: some View {
        TabView {
            NavigationStack {
                TomorrowDashboard(model: model, isPresentingSettings: $isPresentingSettings)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button {
                                isPresentingSettings = true
                            } label: {
                                Image(systemName: "slider.horizontal.3")
                                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                            }
                        }
                    }
            }
            .tabItem {
                Label("明天", systemImage: "sun.max")
            }

            NavigationStack {
                WardrobeGallery(model: model)
            }
            .tabItem {
                Label("衣橱", systemImage: "hanger")
            }

            NavigationStack {
                LooksStudio(model: model)
            }
            .tabItem {
                Label("穿搭", systemImage: "sparkles")
            }
        }
        .tint(LookTheme.ink)
        .toolbarBackground(Color.white.opacity(0.92), for: .tabBar)
        .sheet(isPresented: $isPresentingSettings) {
            SettingsSheet(model: model)
                .presentationDetents([.medium])
        }
    }
}

private struct TomorrowDashboard: View {
    @ObservedObject var model: AppModel
    @Binding var isPresentingSettings: Bool

    private let scenarioLabels: [String: String] = [
        "commute-atelier": "通勤",
        "client-rainy": "客户",
        "date-gallery": "约会"
    ]

    var body: some View {
        ZStack {
            LookTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    heroCard
                    controlsCard
                    scenarioEditorCard
                    contextCard
                    if let errorMessage = model.errorMessage {
                        SurfaceCard {
                            Text(errorMessage)
                                .font(.system(.body, design: .rounded))
                                .foregroundStyle(LookTheme.ink)
                        }
                    }
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
        }
        .navigationTitle("明天")
    }

    private var heroCard: some View {
        SurfaceCard {
            Text("明天，穿好再出门。")
                .font(.system(size: 34, weight: .bold, design: .serif))
                .foregroundStyle(LookTheme.ink)

            Text(model.summaryHeadline)
                .font(.system(.headline, design: .rounded).weight(.semibold))
                .foregroundStyle(LookTheme.moss)

            Text(model.summaryBody)
                .font(.system(.body, design: .rounded))
                .foregroundStyle(LookTheme.ink.opacity(0.84))

            WrappingFlow(spacing: 10) {
                TagChip(text: "\(model.looks.count) 套穿搭已就绪", filled: true)
                    .accessibilityIdentifier("lookCountLabel")
                TagChip(text: model.summaryCityText)
                    .accessibilityIdentifier("summaryCity")
                TagChip(text: model.summarySignText)
                    .accessibilityIdentifier("summarySign")
            }
        }
    }

    private var controlsCard: some View {
        SurfaceCard {
            Text("调整明天条件")
                .font(.system(.title3, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.ink)

            Text("先切换城市、星座和场景，再生成明天的三套穿搭。")
                .font(.system(.subheadline, design: .rounded))
                .foregroundStyle(LookTheme.ink.opacity(0.72))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(CityPreset.demoCities) { city in
                        Button {
                            model.updateCity(city)
                        } label: {
                            Text(city.name)
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                                .foregroundStyle(model.summaryCityText == city.name ? Color.white : LookTheme.ink)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(
                                    Capsule(style: .continuous)
                                        .fill(model.summaryCityText == city.name ? LookTheme.ink : Color.white.opacity(0.58))
                                )
                        }
                        .accessibilityIdentifier("city-\(city.id)")
                    }
                }
            }

            HStack {
                Text("星座")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .foregroundStyle(LookTheme.ink)

                Spacer()

                Menu {
                    ForEach(ZodiacSign.allCases) { sign in
                        Button(sign.displayName) {
                            model.updateZodiac(sign)
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Text(model.summarySignText)
                        Image(systemName: "chevron.down")
                            .font(.caption.weight(.bold))
                    }
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .foregroundStyle(LookTheme.ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Capsule(style: .continuous).fill(Color.white.opacity(0.58)))
                }
                .accessibilityIdentifier("zodiacMenu")
            }

            Button {
                isPresentingSettings = true
            } label: {
                Text("打开设置")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .foregroundStyle(LookTheme.ink)
            }
        }
    }

    private var scenarioEditorCard: some View {
        SurfaceCard {
            Text("明日日程场景")
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

            VStack(alignment: .leading, spacing: 12) {
                fieldLabel("标题")
                TextField(
                    "输入场景标题",
                    text: Binding(
                        get: { model.draftScenario?.title ?? "" },
                        set: { model.updateDraftTitle($0) }
                    )
                )
                .textFieldStyle(.roundedBorder)

                fieldLabel("地点")
                TextField(
                    "输入地点",
                    text: Binding(
                        get: { model.draftScenario?.location ?? "" },
                        set: { model.updateDraftLocation($0) }
                    )
                )
                .textFieldStyle(.roundedBorder)

                ViewThatFits {
                    HStack(spacing: 12) {
                        scenarioDatePicker(
                            title: "开始",
                            selection: Binding(
                                get: { model.draftScenario?.startTime ?? .now },
                                set: { model.updateDraftStart($0) }
                            )
                        )
                        scenarioDatePicker(
                            title: "结束",
                            selection: Binding(
                                get: { model.draftScenario?.endTime ?? .now.addingTimeInterval(3600) },
                                set: { model.updateDraftEnd($0) }
                            )
                        )
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        scenarioDatePicker(
                            title: "开始",
                            selection: Binding(
                                get: { model.draftScenario?.startTime ?? .now },
                                set: { model.updateDraftStart($0) }
                            )
                        )
                        scenarioDatePicker(
                            title: "结束",
                            selection: Binding(
                                get: { model.draftScenario?.endTime ?? .now.addingTimeInterval(3600) },
                                set: { model.updateDraftEnd($0) }
                            )
                        )
                    }
                }
                .font(.system(.subheadline, design: .rounded))
            }

            Button {
                Task { await model.refreshLooks() }
            } label: {
                HStack {
                    if model.isRefreshingLooks {
                        ProgressView()
                            .tint(Color.white)
                    }
                    Text(model.isRefreshingLooks ? "生成中…" : "生成 3 套穿搭")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(LookTheme.ink)
                )
                .foregroundStyle(Color.white)
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("refreshButton")
        }
    }

    private var contextCard: some View {
        SurfaceCard {
            Text("明天信息")
                .font(.system(.title3, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.ink)

            if let context = model.recommendation?.context {
                VStack(alignment: .leading, spacing: 12) {
                    detailRow(title: "天气", value: context.weather.summary)
                    detailRow(title: "幸运色", value: localizedColorName(context.fortune.luckyColor))
                    detailRow(title: "状态", value: localizedMood(context.fortune.mood))
                    detailRow(title: "场景", value: context.scenario.title)
                }
            } else if model.isBootstrapping {
                ProgressView("正在加载明天的信息…")
                    .font(.system(.body, design: .rounded))
            } else {
                Text("首次生成完成后，推荐依据会显示在这里。")
                    .font(.system(.body, design: .rounded))
                    .foregroundStyle(LookTheme.ink.opacity(0.72))
            }
        }
    }

    private func fieldLabel(_ title: String) -> some View {
        Text(title)
            .font(.system(.caption, design: .rounded).weight(.bold))
            .foregroundStyle(LookTheme.ink.opacity(0.62))
    }

    private func scenarioDatePicker(title: String, selection: Binding<Date>) -> some View {
        DatePicker(
            title,
            selection: selection,
            displayedComponents: [.date, .hourAndMinute]
        )
        .labelsHidden()
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.45))
        )
        .overlay(alignment: .topLeading) {
            Text(title)
                .font(.system(.caption, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.ink.opacity(0.62))
                .padding(.horizontal, 12)
                .padding(.top, 8)
        }
    }

    private func detailRow(title: String, value: String) -> some View {
        HStack(alignment: .top) {
            Text(title.uppercased())
                .font(.system(.caption, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.clay)
                .frame(width: 88, alignment: .leading)

            Text(value)
                .font(.system(.subheadline, design: .rounded).weight(.medium))
                .foregroundStyle(LookTheme.ink)
        }
    }
}

private struct WardrobeGallery: View {
    @ObservedObject var model: AppModel

    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 14)
    ]

    var body: some View {
        ZStack {
            LookTheme.background.ignoresSafeArea()

            ScrollView {
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

                            Text(item.colors.map(localizedColorName).joined(separator: " • "))
                                .font(.system(.caption, design: .rounded))
                                .foregroundStyle(LookTheme.ink.opacity(0.7))
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
        }
        .navigationTitle("衣橱")
    }
}

private struct LooksStudio: View {
    @ObservedObject var model: AppModel

    var body: some View {
        ZStack {
            LookTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let firstWarning = model.warnings.first {
                        SurfaceCard {
                            Text("流程提示")
                                .font(.system(.headline, design: .rounded).weight(.bold))
                                .foregroundStyle(LookTheme.ink)

                            Text(firstWarning)
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(LookTheme.ink.opacity(0.76))
                        }
                    }

                    ForEach(Array(model.looks.enumerated()), id: \.element.id) { index, look in
                        SurfaceCard {
                            Text("穿搭 \(index + 1)")
                                .font(.system(.caption, design: .rounded).weight(.bold))
                                .foregroundStyle(LookTheme.clay)
                                .accessibilityIdentifier("lookTitle_\(index)")

                            Text(look.summary)
                                .font(.system(.title3, design: .serif).weight(.bold))
                                .foregroundStyle(LookTheme.ink)

                            flowSection(title: "单品", values: look.itemIds.map(model.wardrobeItemName(for:)))
                            explanationRow(title: "天气", value: look.whyWeatherFit)
                            explanationRow(title: "场景", value: look.whyScenarioFit)
                            explanationRow(title: "运势", value: look.whyFortuneFit)
                            flowSection(title: "灵感", values: look.inspirationIds.map(model.inspirationTitle(for:)))
                        }
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("lookCard_\(index)")
                    }
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
        }
        .navigationTitle("穿搭")
    }

    private func flowSection(title: String, values: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.system(.caption, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.clay)

            FlowLayout(values: values)
        }
    }

    private func explanationRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.system(.caption, design: .rounded).weight(.bold))
                .foregroundStyle(LookTheme.clay)

            Text(value)
                .font(.system(.subheadline, design: .rounded))
                .foregroundStyle(LookTheme.ink.opacity(0.82))
        }
    }
}

private struct SettingsSheet: View {
    @ObservedObject var model: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("城市") {
                    ForEach(CityPreset.demoCities) { city in
                        Button {
                            model.updateCity(city)
                        } label: {
                            HStack {
                                Text(city.name)
                                Spacer()
                                if city.name == model.summaryCityText {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(LookTheme.moss)
                                }
                            }
                        }
                        .foregroundStyle(LookTheme.ink)
                    }
                }

                Section("星座") {
                    Picker("星座", selection: Binding(
                        get: { model.zodiacSign },
                        set: { model.updateZodiac($0) }
                    )) {
                        ForEach(ZodiacSign.allCases) { sign in
                            Text(sign.displayName).tag(sign)
                        }
                    }
                }
            }
            .navigationTitle("设置")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") {
                        dismiss()
                    }
                }
            }
        }
    }
}

private func localizedColorName(_ raw: String) -> String {
    switch raw.lowercased() {
    case "olive":
        return "橄榄绿"
    case "ink":
        return "墨黑"
    case "cream":
        return "奶油白"
    case "ivory":
        return "象牙白"
    case "charcoal":
        return "炭灰"
    case "navy":
        return "海军蓝"
    case "gold":
        return "金色"
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
            fallbackView
        }
        .overlay(alignment: .topLeading) {
            TagChip(text: item.category.title, filled: true)
                .padding(10)
        }
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

private struct FlowLayout: View {
    let values: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(values, id: \.self) { value in
                TagChip(text: value)
            }
        }
    }
}

private struct WrappingFlow<Content: View>: View {
    let spacing: CGFloat
    let content: Content

    init(spacing: CGFloat = 8, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .top, spacing: spacing) {
                content
            }

            VStack(alignment: .leading, spacing: spacing) {
                content
            }
        }
    }
}
