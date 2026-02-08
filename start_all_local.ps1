$ErrorActionPreference = "Stop"

function Test-PortOpen {
    param(
        [string]$ComputerName = "localhost",
        [int]$Port
    )
    $tcp = New-Object Net.Sockets.TcpClient
    try {
        $tcp.Connect($ComputerName, $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# Redis check removed as all services now use in-memory fallbacks.
Write-Host "Skipping Redis check (Services are now Redis-free)." -ForegroundColor Green

$services = @(
    @{ Name = "API Gateway"; Path = "api-gateway"; Command = "npm run dev" },
    @{ Name = "Auth Service"; Path = "services\auth-service"; Command = "npm run start:dev" },
    @{ Name = "Hiring Service"; Path = "services\hiring-service"; Command = "npm run start:dev" },
    @{ Name = "Payment Service"; Path = "services\payment-service"; Command = "npm run start:dev" },
    @{ Name = "AI Engine"; Path = "services\ai-engine"; Command = ".\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001" }
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\$($service.Path)'; $($service.Command)"
}

Write-Host "All services started in separate windows." -ForegroundColor Cyan
