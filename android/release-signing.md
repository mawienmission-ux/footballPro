# Android release signing

This app uses the package name `com.missionfootball.app` and the app label `M.MissionFootball`.

## 1. Create a local release keystore

From the Android project folder, run:

```powershell
./generate-keystore.ps1
```

This will prompt for:
- keystore password
- key password
- generate a keystore named `release-keystore.jks`
- write `keystore.properties` for Gradle to consume

## 2. Build the release APK/AAB

```powershell
./gradlew.bat assembleRelease
```

or:

```powershell
./gradlew.bat bundleRelease
```

## 3. Distribution notes

- Keep `release-keystore.jks` and `keystore.properties` local.
- Do not commit them to source control.
- If you lose the keystore, Google Play will require a new upload key.
- Keep the same signing config for future updates.

## 4. Bundle naming

- Application ID: `com.missionfootball.app`
- App name: `M.MissionFootball`
- Version name: `1.0.0`
- Version code: `1`

These values are set in [android/app/build.gradle](android/app/build.gradle) and [capacitor.config.ts](capacitor.config.ts).
