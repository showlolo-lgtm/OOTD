import SwiftUI

enum LookTheme {
    static let paper = Color(red: 0.96, green: 0.94, blue: 0.90)
    static let sand = Color(red: 0.88, green: 0.80, blue: 0.69)
    static let moss = Color(red: 0.43, green: 0.51, blue: 0.39)
    static let ink = Color(red: 0.14, green: 0.17, blue: 0.22)
    static let clay = Color(red: 0.70, green: 0.48, blue: 0.39)
    static let mist = Color.white.opacity(0.68)

    static let background = LinearGradient(
        colors: [
            Color(red: 0.98, green: 0.95, blue: 0.91),
            Color(red: 0.90, green: 0.84, blue: 0.76),
            Color(red: 0.72, green: 0.80, blue: 0.74)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let cardFill = LinearGradient(
        colors: [
            Color.white.opacity(0.74),
            Color(red: 0.95, green: 0.93, blue: 0.88).opacity(0.88)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let outline = Color.white.opacity(0.45)
}

struct SurfaceCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            content
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(LookTheme.cardFill)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(LookTheme.outline, lineWidth: 1)
        )
        .shadow(color: LookTheme.ink.opacity(0.08), radius: 24, x: 0, y: 14)
    }
}

struct TagChip: View {
    let text: String
    var filled: Bool = false

    var body: some View {
        Text(text)
            .font(.system(.caption, design: .rounded).weight(.semibold))
            .foregroundStyle(filled ? Color.white : LookTheme.ink)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Capsule(style: .continuous)
                    .fill(filled ? LookTheme.ink : Color.white.opacity(0.55))
            )
    }
}
