# Revert Kaizen ERM Auto-Start Setup
# Removes the scheduled tasks that start the servers at Windows login
# Run this script as Administrator

try {
    Unregister-ScheduledTask -TaskName 'KaizenERM_Backend' -Confirm:$false -ErrorAction Stop
    Write-Host "✅ Backend auto-start task removed."
} catch {
    Write-Host "⚠️ Could not remove Backend task (it may not exist or requires Administrator privileges)."
}

try {
    Unregister-ScheduledTask -TaskName 'KaizenERM_Frontend' -Confirm:$false -ErrorAction Stop
    Write-Host "✅ Frontend auto-start task removed."
} catch {
    Write-Host "⚠️ Could not remove Frontend task (it may not exist or requires Administrator privileges)."
}

Write-Host ""
Write-Host "Press any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
