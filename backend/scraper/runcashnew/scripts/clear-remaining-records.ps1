# Script PowerShell para limpar os registros específicos que ainda têm números

# Informações da instância do frontend
$frontendApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ"
$frontendUrl = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roletas"

$headers = @{
    "apikey" = $frontendApiKey
    "Authorization" = "Bearer $frontendApiKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Função para obter todos os registros com suas IDs e informações
function Get-AllRecords {
    Write-Host "Buscando todos os registros da tabela roletas..."
    
    $getUrl = "$frontendUrl?select=id,nome,numeros"
    
    try {
        $response = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers
        Write-Host "Encontrados $($response.Count) registros no total."
        return $response
    }
    catch {
        Write-Host "Erro ao buscar registros: $_" -ForegroundColor Red
        return $null
    }
}

# Função para limpar números de uma roleta específica
function Clear-RouletteNumbers {
    param (
        [string]$Id,
        [string]$Name
    )
    
    Write-Host "Limpando números da roleta '$Name' (ID: $Id)..."
    
    $updateUrl = "$frontendUrl?id=eq.$Id"
    $body = @{ "numeros" = @() } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $updateUrl -Method Patch -Headers $headers -Body $body
        Write-Host "Roleta '$Name' limpa com sucesso!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Erro ao limpar roleta '$Name': $_" -ForegroundColor Red
        return $false
    }
}

# Obter todos os registros
$records = Get-AllRecords

if ($null -eq $records) {
    Write-Host "Não foi possível obter os registros. Encerrando script." -ForegroundColor Red
    exit
}

# Filtrar apenas os registros que têm números
$recordsWithNumbers = $records | Where-Object { $_.numeros -ne $null -and $_.numeros.Count -gt 0 }

Write-Host "`nEncontrados $($recordsWithNumbers.Count) registros com números para limpar:`n" -ForegroundColor Cyan

# Listar as roletas que serão limpas
foreach ($record in $recordsWithNumbers) {
    $numbersCount = $record.numeros.Count
    Write-Host "- $($record.nome) ($numbersCount números)"
}

Write-Host "`nIniciando processo de limpeza..." -ForegroundColor Yellow

# Limpar os registros que têm números
$successCount = 0
$failCount = 0

foreach ($record in $recordsWithNumbers) {
    $result = Clear-RouletteNumbers -Id $record.id -Name $record.nome
    
    if ($result) {
        $successCount++
    }
    else {
        $failCount++
    }
}

# Resultados finais
Write-Host "`nProcesso de limpeza concluído!" -ForegroundColor Cyan
Write-Host "Roletas limpas com sucesso: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Roletas com falha na limpeza: $failCount" -ForegroundColor Red
}

Write-Host "`nVerificando resultados finais..." -ForegroundColor Cyan
$finalRecords = Get-AllRecords

$stillWithNumbers = $finalRecords | Where-Object { $_.numeros -ne $null -and $_.numeros.Count -gt 0 }

if ($stillWithNumbers.Count -eq 0) {
    Write-Host "Todas as roletas foram limpas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "Ainda existem $($stillWithNumbers.Count) roletas com números:" -ForegroundColor Yellow
    foreach ($record in $stillWithNumbers) {
        Write-Host "- $($record.nome) ($($record.numeros.Count) números)" -ForegroundColor Yellow
    }
} 