// swift-tools-version:5.9
import PackageDescription

// Swift package plugin for cordova-ios 8: the product name must be the plugin id.
let package = Package(
    name: "watchtower-cordova",
    platforms: [.iOS(.v13)],
    products: [.library(name: "watchtower-cordova", targets: ["WatchtowerCordova"])],
    dependencies: [
        .package(url: "https://github.com/apache/cordova-ios.git", from: "8.0.0"),
        .package(url: "https://github.com/watchtowerobservability/watchtower-ios", from: "0.1.0"),
    ],
    targets: [
        .target(
            name: "WatchtowerCordova",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "Watchtower", package: "watchtower-ios"),
            ],
            path: "src/ios"
        ),
    ]
)
