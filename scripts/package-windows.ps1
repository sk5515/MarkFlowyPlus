param(
  [ValidateSet("nsis", "msi")]
  [string]$Bundle = "nsis",
  [switch]$ForceManualNsis,
  [switch]$InstallPrereqs,
  [switch]$SkipFrontendBuild
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DesktopDir = Join-Path $Root "apps\desktop"
$TauriDir = Join-Path $DesktopDir "src-tauri"
$TargetDir = Join-Path $Root "target"
$ReleaseExe = Join-Path $TargetDir "release\markflowy.exe"
$ManualDir = Join-Path $TargetDir "manual-installer"
$ManualNsi = Join-Path $ManualDir "MarkFlowyPlus.nsi"

function Add-PathEntry {
  param([string]$Path)
  if ($Path -and (Test-Path $Path) -and (($env:Path -split ";") -notcontains $Path)) {
    $env:Path = "$Path;$env:Path"
  }
}

function Get-CommandPath {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )
  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  & $Script
}

function Install-WithWinget {
  param(
    [string]$Id,
    [string]$Override = ""
  )
  if (-not (Get-CommandPath "winget.exe")) {
    throw "winget.exe not found. Install $Id manually, then rerun this script."
  }

  $args = @(
    "install", "--id", $Id, "-e", "--silent",
    "--accept-package-agreements", "--accept-source-agreements"
  )
  if ($Override) {
    $args += @("--override", $Override)
  }
  & winget.exe @args
}

function Ensure-Prereqs {
  if ($InstallPrereqs) {
    if (-not (Get-CommandPath "rustup.exe") -and -not (Test-Path "$env:USERPROFILE\.cargo\bin\rustup.exe")) {
      Install-WithWinget "Rustlang.Rustup"
    }

    if (-not (Test-Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe")) {
      Install-WithWinget "Microsoft.VisualStudio.2022.BuildTools" "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --norestart"
    }

    if ($Bundle -eq "nsis" -or $ForceManualNsis) {
      if (-not (Test-Path "${env:ProgramFiles(x86)}\NSIS\makensis.exe")) {
        Install-WithWinget "NSIS.NSIS"
      }
    }

    if ($Bundle -eq "msi") {
      if (-not (Test-Path "${env:ProgramFiles(x86)}\WiX Toolset v3.14\bin\candle.exe")) {
        Install-WithWinget "WiXToolset.WiXToolset"
      }
    }
  }

  Add-PathEntry "$env:USERPROFILE\.cargo\bin"
  if (-not (Get-CommandPath "cargo.exe")) {
    throw "Cargo/Rust not found. Install Rust first or rerun with -InstallPrereqs."
  }
  if (-not (Get-CommandPath "yarn.cmd") -and -not (Get-CommandPath "yarn.ps1")) {
    throw "Yarn not found. Enable Corepack or install Yarn 4.8.0."
  }
}

function Configure-Msvc {
  $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
  if (-not (Test-Path $vswhere)) {
    throw "Visual Studio Build Tools not found. Install C++ Build Tools or rerun with -InstallPrereqs."
  }

  $vsPath = & $vswhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  if (-not $vsPath) {
    throw "Visual Studio C++ tools not found. Install workload Microsoft.VisualStudio.Workload.VCTools."
  }

  $msvcRoot = Join-Path $vsPath "VC\Tools\MSVC"
  $msvc = Get-ChildItem $msvcRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $msvc) {
    throw "MSVC tools directory not found under $msvcRoot."
  }

  $sdkRoot = "${env:ProgramFiles(x86)}\Windows Kits\10"
  $sdk = Get-ChildItem (Join-Path $sdkRoot "Lib") -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $sdk) {
    throw "Windows 10 SDK not found. Install it via Visual Studio Build Tools."
  }

  $msvcPath = $msvc.FullName
  $sdkVersion = $sdk.Name

  Add-PathEntry (Join-Path $msvcPath "bin\Hostx64\x64")
  Add-PathEntry (Join-Path $sdkRoot "bin\$sdkVersion\x64")
  Add-PathEntry (Join-Path $sdkRoot "bin\x64")

  $env:INCLUDE = @(
    Join-Path $msvcPath "include"
    Join-Path $sdkRoot "Include\$sdkVersion\ucrt"
    Join-Path $sdkRoot "Include\$sdkVersion\um"
    Join-Path $sdkRoot "Include\$sdkVersion\shared"
    Join-Path $sdkRoot "Include\$sdkVersion\winrt"
    Join-Path $sdkRoot "Include\$sdkVersion\cppwinrt"
  ) -join ";"

  $env:LIB = @(
    Join-Path $msvcPath "lib\x64"
    Join-Path $sdkRoot "Lib\$sdkVersion\ucrt\x64"
    Join-Path $sdkRoot "Lib\$sdkVersion\um\x64"
  ) -join ";"

  if (-not (Get-CommandPath "link.exe")) {
    throw "MSVC linker link.exe not found after environment setup."
  }
}

function Get-AppMetadata {
  $tauriConf = Get-Content (Join-Path $TauriDir "tauri.conf.json") -Raw | ConvertFrom-Json
  $cargoToml = Get-Content (Join-Path $TauriDir "Cargo.toml") -Raw
  $crateVersion = if ($cargoToml -match '(?m)^version\s*=\s*"([^"]+)"') { $Matches[1] } else { $tauriConf.version }

  [pscustomobject]@{
    ProductName = $tauriConf.productName
    Version = $tauriConf.version
    CrateVersion = $crateVersion
    Publisher = "drl990114"
    Icon = Join-Path $TauriDir "icons\icon.ico"
  }
}

function ConvertTo-NsisText {
  param([string]$Value)
  return ($Value -replace "\\", "\\" -replace '"', '$\"')
}

function Write-ManualNsisInstaller {
  $meta = Get-AppMetadata
  if (-not (Test-Path $ReleaseExe)) {
    throw "Release executable not found at $ReleaseExe. Run the Tauri build first."
  }

  $makensis = Get-CommandPath "makensis.exe"
  if (-not $makensis) {
    Add-PathEntry "${env:ProgramFiles(x86)}\NSIS"
    $makensis = Get-CommandPath "makensis.exe"
  }
  if (-not $makensis) {
    throw "makensis.exe not found. Install NSIS or rerun with -InstallPrereqs."
  }

  New-Item -ItemType Directory -Force -Path $ManualDir | Out-Null

  $outputName = "$($meta.ProductName)-$($meta.Version)-setup.exe"
  $outputPath = Join-Path $ManualDir $outputName
  $installDir = '$LOCALAPPDATA\Programs\' + $meta.ProductName
  $registryKey = "Software\$($meta.ProductName)"
  $uninstallKey = "Software\Microsoft\Windows\CurrentVersion\Uninstall\$($meta.ProductName)"
  $product = ConvertTo-NsisText $meta.ProductName
  $publisher = ConvertTo-NsisText $meta.Publisher
  $version = ConvertTo-NsisText $meta.Version
  $icon = ConvertTo-NsisText $meta.Icon
  $exe = ConvertTo-NsisText $ReleaseExe
  $out = ConvertTo-NsisText $outputPath
  $regKey = ConvertTo-NsisText $registryKey
  $uninstKey = ConvertTo-NsisText $uninstallKey

  $nsi = @"
Unicode true
RequestExecutionLevel user

!include "MUI2.nsh"

Name "$product"
OutFile "$out"
InstallDir "$installDir"
InstallDirRegKey HKCU "$regKey" "InstallDir"

!define MUI_ICON "$icon"
!define MUI_UNICON "$icon"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "`$INSTDIR"
  File "/oname=markflowy.exe" "$exe"

  WriteUninstaller "`$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "$regKey" "InstallDir" "`$INSTDIR"
  WriteRegStr HKCU "$uninstKey" "DisplayName" "$product"
  WriteRegStr HKCU "$uninstKey" "DisplayVersion" "$version"
  WriteRegStr HKCU "$uninstKey" "Publisher" "$publisher"
  WriteRegStr HKCU "$uninstKey" "DisplayIcon" "`$INSTDIR\markflowy.exe"
  WriteRegStr HKCU "$uninstKey" "InstallLocation" "`$INSTDIR"
  WriteRegStr HKCU "$uninstKey" "UninstallString" "`$INSTDIR\Uninstall.exe"
  WriteRegDWORD HKCU "$uninstKey" "NoModify" 1
  WriteRegDWORD HKCU "$uninstKey" "NoRepair" 1

  CreateDirectory "`$SMPROGRAMS\$product"
  CreateShortcut "`$SMPROGRAMS\$product\$product.lnk" "`$INSTDIR\markflowy.exe"
  CreateShortcut "`$DESKTOP\$product.lnk" "`$INSTDIR\markflowy.exe"
SectionEnd

Section "Uninstall"
  Delete "`$DESKTOP\$product.lnk"
  Delete "`$SMPROGRAMS\$product\$product.lnk"
  RMDir "`$SMPROGRAMS\$product"
  Delete "`$INSTDIR\markflowy.exe"
  Delete "`$INSTDIR\Uninstall.exe"
  RMDir "`$INSTDIR"
  DeleteRegKey HKCU "$uninstKey"
  DeleteRegKey HKCU "$regKey"
SectionEnd
"@

  Set-Content -Path $ManualNsi -Value $nsi -Encoding UTF8
  & $makensis $ManualNsi

  if (-not (Test-Path $outputPath)) {
    throw "NSIS did not create $outputPath."
  }

  Write-Host ""
  Write-Host "Manual NSIS installer created:" -ForegroundColor Green
  Write-Host $outputPath
}

function Invoke-TauriBundle {
  param([string]$BundleName)
  $configJson = '{\"bundle\":{\"useLocalToolsDir\":true}}'
  & yarn workspace "@markflowy/desktop" tauri build -b $BundleName -c $configJson
  if ($LASTEXITCODE -ne 0) {
    throw "Tauri bundling failed with exit code $LASTEXITCODE."
  }
}

Push-Location $Root
try {
  Invoke-Step "Checking prerequisites" {
    Ensure-Prereqs
    Configure-Msvc
    Add-PathEntry "${env:ProgramFiles(x86)}\NSIS"
    Add-PathEntry "${env:ProgramFiles(x86)}\WiX Toolset v3.14\bin"
  }

  if (-not (Test-Path (Join-Path $Root "node_modules"))) {
    Invoke-Step "Installing dependencies" { & yarn install }
  }

  if (-not $SkipFrontendBuild) {
    Invoke-Step "Building frontend/workspaces" { & yarn build }
  }

  if ($ForceManualNsis) {
    Invoke-Step "Building Tauri executable without bundling" {
      & yarn workspace "@markflowy/desktop" tauri build --no-bundle
    }
    Invoke-Step "Creating manual NSIS installer" { Write-ManualNsisInstaller }
    exit 0
  }

  Invoke-Step "Creating Tauri $Bundle installer" {
    try {
      Invoke-TauriBundle $Bundle
    } catch {
      if ($Bundle -ne "nsis") {
        throw
      }
      Write-Warning "Tauri NSIS bundling failed. Falling back to local NSIS. Original error: $($_.Exception.Message)"
      if (-not (Test-Path $ReleaseExe)) {
        & yarn workspace "@markflowy/desktop" tauri build --no-bundle
      }
      Write-ManualNsisInstaller
    }
  }
} finally {
  Pop-Location
}
