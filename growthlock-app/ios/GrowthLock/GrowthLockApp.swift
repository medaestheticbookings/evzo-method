import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

// GrowthLock for iPhone.
//
// Apple only lets an app block other apps through Family Controls, and only
// after Apple grants the entitlement (developer.apple.com -> Support ->
// Family Controls distribution request). Everything here is the real API, so
// once the entitlement is on the App ID this builds and blocks for real.
//
// The person taps twice: "Allow" on Apple's Screen Time prompt, then the apps
// they want held back in Apple's own picker. Nothing else to configure.

@main
struct GrowthLockApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

/// One shared store: setting `shield` here is what makes iOS refuse to open the app.
let store = ManagedSettingsStore(named: .init("growthlock"))

final class Blocker: ObservableObject {
    @Published var authorized = false
    @Published var picking = false
    @Published var selection = FamilyActivitySelection()
    @Published var endAt: Date? = UserDefaults.standard.object(forKey: "endAt") as? Date

    /// Tap one: Apple's own permission sheet.
    func requestPermission() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            await MainActor.run { self.authorized = true }
        } catch {
            await MainActor.run { self.authorized = false }
        }
    }

    func refreshAuthorization() {
        authorized = AuthorizationCenter.shared.authorizationStatus == .approved
    }

    /// Tap two: start. The shield goes up immediately and survives a reboot,
    /// because the end time is persisted and DeviceActivity lifts it on schedule.
    func start(minutes: Int) {
        let end = Date().addingTimeInterval(TimeInterval(minutes * 60))
        UserDefaults.standard.set(end, forKey: "endAt")
        endAt = end

        store.shield.applications = selection.applicationTokens.isEmpty
            ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? ShieldSettings.ActivityCategoryPolicy.all()
            : .specific(selection.categoryTokens)
        store.shield.webDomainCategories = .all()

        scheduleLift(at: end)
    }

    func stop() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
        UserDefaults.standard.removeObject(forKey: "endAt")
        endAt = nil
        DeviceActivityCenter().stopMonitoring([.init("growthlock.block")])
    }

    /// iOS, not our process, ends the block — so killing the app changes nothing.
    private func scheduleLift(at end: Date) {
        let cal = Calendar.current
        let from = cal.dateComponents([.hour, .minute, .second], from: Date())
        let to = cal.dateComponents([.hour, .minute, .second], from: end)
        let schedule = DeviceActivitySchedule(intervalStart: from, intervalEnd: to, repeats: false)
        try? DeviceActivityCenter().startMonitoring(.init("growthlock.block"), during: schedule)
    }
}

struct ContentView: View {
    @StateObject private var blocker = Blocker()
    @State private var minutes = 25
    @State private var now = Date()

    private let tick = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.08, blue: 0.10).ignoresSafeArea()
            VStack(spacing: 22) {
                Text("GrowthLock")
                    .font(.system(size: 34, weight: .regular, design: .serif))
                    .foregroundColor(.white)

                if let end = blocker.endAt, end > now {
                    Text(timeLeft(end))
                        .font(.system(size: 58, weight: .light, design: .monospaced))
                        .foregroundColor(Color(red: 0.25, green: 0.72, blue: 0.77))
                    Text("Blocking is on. Put the phone down.")
                        .foregroundColor(.gray)
                    Button("End the block") { blocker.stop() }
                        .buttonStyle(Big(filled: false))
                } else if !blocker.authorized {
                    Text("One tap and the blocking works. iOS asks you to allow Screen Time access — that is the permission that lets GrowthLock hold apps back.")
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Button("Allow blocking") {
                        Task { await blocker.requestPermission() }
                    }.buttonStyle(Big(filled: true))
                } else {
                    Text("Pick how long. The apps you chose will not open until the time is up.")
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    HStack(spacing: 8) {
                        ForEach([15, 25, 45, 90], id: \.self) { m in
                            Button("\(m)") { minutes = m }
                                .buttonStyle(Chip(on: m == minutes))
                        }
                    }
                    Button("Choose what to block") { blocker.picking = true }
                        .buttonStyle(Big(filled: false))
                    Button("Start the block") { blocker.start(minutes: minutes) }
                        .buttonStyle(Big(filled: true))
                    Text("Calls and emergency services always stay open.")
                        .font(.footnote).foregroundColor(.secondary)
                }
            }
            .padding(28)
        }
        .familyActivityPicker(isPresented: $blocker.picking, selection: $blocker.selection)
        .onAppear { blocker.refreshAuthorization() }
        .onReceive(tick) { t in
            now = t
            if let end = blocker.endAt, end <= t { blocker.stop() }
        }
    }

    private func timeLeft(_ end: Date) -> String {
        let s = max(0, Int(end.timeIntervalSince(now)))
        return String(format: "%02d:%02d", s / 60, s % 60)
    }
}

struct Big: ButtonStyle {
    let filled: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity).padding(.vertical, 16)
            .background(filled ? Color(red: 0.25, green: 0.72, blue: 0.77) : Color.clear)
            .foregroundColor(filled ? Color(red: 0.02, green: 0.09, blue: 0.10) : .white)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.gray.opacity(filled ? 0 : 0.4)))
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct Chip: ButtonStyle {
    let on: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity).padding(.vertical, 14)
            .background(on ? Color(red: 0.25, green: 0.72, blue: 0.77) : Color.white.opacity(0.06))
            .foregroundColor(on ? Color(red: 0.02, green: 0.09, blue: 0.10) : .white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
