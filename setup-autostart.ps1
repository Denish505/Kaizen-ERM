# Kaizen ERM Auto-Start Setup
# Registers both servers to start automatically at Windows login
# Run this script as Administrator once

$projectRoot = "c:\Web App Development\Kaizen ERM"
$backendBat  = "$projectRoot\start-backend.bat"
$frontendBat = "$projectRoot\start-frontend.bat"

# --- Backend Task ---
$actionBackend = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$backendBat`"" `
    -WorkingDirectory "$projectRoot\erp_backend"

$triggerLogin = New-ScheduledTaskTrigger -AtLogOn

$settingsBackend = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 24) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "KaizenERM_Backend" `
    -Action $actionBackend `
    -Trigger $triggerLogin `
    -Settings $settingsBackend `
    -Description "Kaizen ERM Django Backend (port 8000)" `
    -RunLevel Highest `
    -Force

Write-Host "✅ Backend task registered."

# --- Frontend Task ---
$actionFrontend = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$frontendBat`"" `
    -WorkingDirectory "$projectRoot"

$settingsFrontend = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 24) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "KaizenERM_Frontend" `
    -Action $actionFrontend `
    -Trigger $triggerLogin `
    -Settings $settingsFrontend `
    -Description "Kaizen ERM React Frontend (Vite dev server)" `
    -RunLevel Highest `
    -Force

Write-Host "✅ Frontend task registered."
Write-Host ""
Write-Host "Both servers will now auto-start every time you log into Windows."
Write-Host "To stop auto-start, run: Unregister-ScheduledTask -TaskName 'KaizenERM_Backend' -Confirm:`$false"
Write-Host "                         Unregister-ScheduledTask -TaskName 'KaizenERM_Frontend' -Confirm:`$false"
