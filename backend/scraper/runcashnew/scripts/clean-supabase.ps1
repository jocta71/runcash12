# Script PowerShell para limpar os dados da tabela 'roletas' no Supabase

# Informações da instância do backend
$backendApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnZrbWxqcnpxcWVxbWZwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0NTM1NzYsImV4cCI6MjAzMTAyOTU3Nn0.Gg5hMJ9iqkPEZUCKWNt0jWGDnxwjAL2h4dOQwLnrJGg"
$backendUrl = "https://vjrvkmljrzqqeqmfpqbk.supabase.co/rest/v1/roletas?id=neq.0"

# Informações da instância do frontend
$frontendApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ"
$frontendUrl = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roletas?id=neq.0"

# Função para limpar tabela no Supabase
function Clear-SupabaseTable {
    param (
        [string]$ApiKey,
        [string]$Url,
        [string]$InstanceName
    )
    
    Write-Host "Iniciando limpeza da tabela roletas na instância $InstanceName..."
    
    $headers = @{
        "apikey" = $ApiKey
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Delete -Headers $headers
        Write-Host "[$InstanceName] Tabela roletas limpa com sucesso!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[$InstanceName] Erro ao limpar tabela: $_" -ForegroundColor Red
        return $false
    }
}

# Como alternativa, podemos também zerar os números em vez de deletar registros
function Update-RouletteNumbers {
    param (
        [string]$ApiKey,
        [string]$BaseUrl,
        [string]$InstanceName
    )
    
    Write-Host "Atualizando registros na instância $InstanceName para ter arrays vazios..."
    
    $url = $BaseUrl -replace "\?.*$", "" # Remove qualquer parâmetro de consulta
    $getUrl = "$url?select=id"
    
    $headers = @{
        "apikey" = $ApiKey
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }
    
    try {
        # Primeiro, obter todos os IDs
        $records = Invoke-RestMethod -Uri $getUrl -Method Get -Headers $headers
        
        if ($records.Count -eq 0) {
            Write-Host "[$InstanceName] Nenhum registro encontrado para atualizar." -ForegroundColor Yellow
            return $true
        }
        
        Write-Host "[$InstanceName] Encontrados $($records.Count) registros para atualizar." -ForegroundColor Cyan
        
        # Para cada registro, atualizar o campo 'numeros' para um array vazio
        foreach ($record in $records) {
            $updateUrl = "$url?id=eq.$($record.id)"
            $body = @{ "numeros" = @() } | ConvertTo-Json
            
            $updateResponse = Invoke-RestMethod -Uri $updateUrl -Method Patch -Headers $headers -Body $body
            Write-Host "[$InstanceName] Registro $($record.id) atualizado com array vazio." -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "[$InstanceName] Erro ao atualizar registros: $_" -ForegroundColor Red
        return $false
    }
}

# Limpar ambas as instâncias
Write-Host "Iniciando limpeza das instâncias do Supabase..." -ForegroundColor Cyan

# Primeiro, tente o método DELETE
Write-Host "Tentando método DELETE..."
$backendSuccess = Clear-SupabaseTable -ApiKey $backendApiKey -Url $backendUrl -InstanceName "Backend"
$frontendSuccess = Clear-SupabaseTable -ApiKey $frontendApiKey -Url $frontendUrl -InstanceName "Frontend"

# Se o DELETE falhar, tente o método PATCH para zerar os arrays
if (-not $backendSuccess -or -not $frontendSuccess) {
    Write-Host "`nMétodo DELETE falhou. Tentando método alternativo (PATCH)..." -ForegroundColor Yellow
    
    if (-not $backendSuccess) {
        $backendBasePath = "https://vjrvkmljrzqqeqmfpqbk.supabase.co/rest/v1/roletas"
        $backendSuccess = Update-RouletteNumbers -ApiKey $backendApiKey -BaseUrl $backendBasePath -InstanceName "Backend"
    }
    
    if (-not $frontendSuccess) {
        $frontendBasePath = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roletas"
        $frontendSuccess = Update-RouletteNumbers -ApiKey $frontendApiKey -BaseUrl $frontendBasePath -InstanceName "Frontend"
    }
}

# Verificar resultados finais
if ($backendSuccess -and $frontendSuccess) {
    Write-Host "`nLimpeza concluída com sucesso em todas as instâncias!" -ForegroundColor Green
}
elseif ($backendSuccess) {
    Write-Host "`nLimpeza concluída apenas na instância do backend." -ForegroundColor Yellow
}
elseif ($frontendSuccess) {
    Write-Host "`nLimpeza concluída apenas na instância do frontend." -ForegroundColor Yellow
}
else {
    Write-Host "`nFalha ao limpar ambas as instâncias." -ForegroundColor Red
}

Write-Host "`nProcesso de limpeza finalizado." 