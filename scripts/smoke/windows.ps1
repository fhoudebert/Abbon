# Test d'installation d'Abbon sous Windows (CI) :
#  1. installateur NSIS en mode silencieux, puis lancement : l'application doit tourner 30 s
#     et avoir créé sa base SQLite ;
#  2. installateur MSI en mode silencieux : doit se terminer sans erreur.
#
# Usage : pwsh scripts/smoke/windows.ps1 -Dist <dossier des installateurs>
param([Parameter(Mandatory = $true)][string]$Dist)
$ErrorActionPreference = 'Stop'

$setup = Get-ChildItem $Dist -Recurse -Filter '*-setup.exe' | Select-Object -First 1
if (-not $setup) { throw "installateur NSIS introuvable dans $Dist" }
Write-Host "Installation : $($setup.Name)"
$p = Start-Process $setup.FullName -ArgumentList '/S' -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "installateur NSIS : code $($p.ExitCode)" }

$dir = Join-Path $env:LOCALAPPDATA 'Abbon'
$exe = Get-ChildItem $dir -Recurse -Filter '*.exe' | Where-Object { $_.Name -notlike 'uninstall*' } | Select-Object -First 1
if (-not $exe) { throw "exécutable introuvable dans $dir" }

$db = Join-Path $env:APPDATA 'org.abbon.app\abbon.db'
if (Test-Path $db) { Remove-Item $db }
$app = Start-Process $exe.FullName -PassThru
Start-Sleep -Seconds 30
if ($app.HasExited) { throw "Abbon s'est arrêté avant 30 s (code $($app.ExitCode))" }
if (-not (Test-Path $db)) { throw "base non créée ($db) : l'interface ne s'est pas chargée" }
Write-Host "OK : Abbon tourne et a créé sa base ($((Get-Item $db).Length) octets)"
Stop-Process -Id $app.Id -Force

$msi = Get-ChildItem $Dist -Recurse -Filter '*.msi' | Select-Object -First 1
if ($msi) {
  Write-Host "Installation : $($msi.Name)"
  $m = Start-Process msiexec.exe -ArgumentList '/i', "`"$($msi.FullName)`"", '/qn', '/norestart', '/l*v', 'msi.log' -Wait -PassThru
  if ($m.ExitCode -ne 0) { Get-Content msi.log -Tail 60; throw "installateur MSI : code $($m.ExitCode)" }
  Write-Host 'OK : MSI installé'
}
