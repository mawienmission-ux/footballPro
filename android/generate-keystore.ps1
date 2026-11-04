$ErrorActionPreference = 'Stop'

$storeFile = Join-Path $PSScriptRoot 'release-keystore.jks'
$propertiesFile = Join-Path $PSScriptRoot 'keystore.properties'
$alias = 'missionfootball'

$storePassword = Read-Host 'Enter the keystore password'
$keyPassword = Read-Host 'Enter the key password'

keytool -genkeypair -v `
  -keystore $storeFile `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $storePassword `
  -keypass $keyPassword `
  -dname "CN=Mission Football, OU=Mobile, O=M Mission Football, L=Juba, ST=Central Equatoria, C=SS"

@"
storeFile=../release-keystore.jks
storePassword=$storePassword
keyAlias=$alias
keyPassword=$keyPassword
"@ | Set-Content -Path $propertiesFile

Write-Host "Keystore created at: $storeFile"
Write-Host "Properties written to: $propertiesFile"
Write-Host "Now run: .\gradlew.bat assembleRelease"
