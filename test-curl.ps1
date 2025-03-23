# URL do endpoint
$endpoint = "http://localhost:5000/emit-event"

# Criar um evento de teste (número aleatório entre 0 e 36)
$numero = Get-Random -Minimum 0 -Maximum 37

# Determinar a cor do número (vermelho, preto ou verde)
$cor = "verde"
if ($numero -gt 0) {
    $numerosVermelhos = @(1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36)
    if ($numerosVermelhos -contains $numero) {
        $cor = "vermelho"
    } else {
        $cor = "preto"
    }
}

# Criar o objeto JSON
$payload = @{
    event = "new_number"
    data = @{
        type = "new_number"
        roleta_id = "test-roulette"
        roleta_nome = "Test Roulette"
        numero = $numero
        cor = $cor
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 10

# Exibir o payload que será enviado
Write-Host "Enviando evento de teste:"
Write-Host $payload

# Realizar a requisição POST
try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $payload -ContentType "application/json"
    Write-Host "Evento enviado com sucesso!"
    Write-Host "Resposta:"
    $response | ConvertTo-Json
} catch {
    Write-Host "Erro ao enviar evento: $_"
} 