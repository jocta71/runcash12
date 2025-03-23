import { ChatMessage } from '@/components/chat/types';

// Lista de nomes para os bots de IA
const botNames = [
  'Fernandinha', 'Zé das Couves', 'Bia', 'Juninho', 'Robertão', 
  'Paty', 'Dudinha', 'Matheuzinho', 'Carlinhos', 'Aninha',
  'Pedrinho', 'Luiza', 'Marcelinho', 'Juju', 'Vitinho'
];

// Lista de avatares (pode ser substituída por avatares reais)
const avatars = [
  '/lovable-uploads/433b5fd4-2378-47fe-9d10-276fead4ebce.png'
];

// Respostas pré-definidas relacionadas a roletas e apostas
const responses = [
  'Acabei de ganhar uma grana boa na roleta!',
  'Alguém sabe qual é a melhor estratégia pra apostar?',
  'Tô jogando há 2 horas e já ganhei 3x o que investi!',
  'Qual roleta tá pagando melhor hoje?',
  'Perdi 50 na última rodada, mas vou recuperar!',
  'Essa dica que vocês deram funcionou demais!',
  'Alguém mais tá apostando na Lightning Roulette?',
  'Já ganhei 5 vezes seguidas apostando no vermelho!',
  'Qual número tá saindo mais hoje?',
  'Acabei de entrar, o que tá rolando?',
  'Tô seguindo aquela estratégia do Martingale e tá dando certo',
  'Alguém mais tá vendo esse padrão de números?',
  'Acho que vou apostar tudo no zero!',
  'Tô com uma sorte incrível hoje!',
  'Qual é a roleta com RTP mais alto aqui?',
  'Vocês preferem apostar em números ou em cores?',
  'Acabei de ganhar no 17, meu número da sorte!',
  'Essa plataforma é muito boa, interface super limpa',
  'Alguém mais tá jogando desde o lançamento?',
  'Quais são as dicas pra quem tá começando?',
  'Nossa, essa nova roleta tá pagando muito bem!',
  'Tô testando aquela estratégia que o moderador falou ontem',
  'Já ganhei o suficiente pra pagar o churrasco do fds!',
  'Vou fazer mais um depósito, tô sentindo que hoje é meu dia de sorte',
  'Quem mais tá jogando agora de madrugada?'
];

// Respostas específicas para quando o usuário menciona certos termos
const keywordResponses: Record<string, string[]> = {
  'olá': ['Oi, tudo bem?', 'E aí, beleza?', 'Olá! Como vai?'],
  'oi': ['Oi, tudo bem?', 'E aí, beleza?', 'Olá! Como vai?'],
  'ajuda': ['Em que posso ajudar?', 'Precisa de dicas para apostar?', 'O que você quer saber?'],
  'dica': ['Eu sempre aposto em números ímpares', 'Tenta a estratégia de dobrar a aposta após cada perda', 'Dizem que apostar no vermelho dá mais sorte'],
  'ganhar': ['Tô ganhando bastante hoje!', 'Já ganhei 3x o que investi', 'A melhor forma de ganhar é apostar com estratégia'],
  'perder': ['Também perdi na última rodada', 'Não desanima, é assim mesmo', 'Depois de perder sempre vem uma boa sequência'],
  'roleta': ['Qual roleta você tá jogando?', 'A roleta Lightning tá pagando bem hoje', 'Eu prefiro a roleta clássica'],
  'número': ['Meu número da sorte é o 17', 'Os números quentes hoje são 7, 23 e 36', 'Tenta apostar em sequências de números'],
  'estratégia': ['A estratégia Martingale funciona bem pra mim', 'Eu gosto de apostar em dúzias', 'A melhor estratégia é gerenciar bem seu bankroll']
};

// Função para selecionar um nome aleatório para o bot
const getRandomBotName = (): string => {
  return botNames[Math.floor(Math.random() * botNames.length)];
};

// Função para selecionar um avatar aleatório
const getRandomAvatar = (): string => {
  return avatars[Math.floor(Math.random() * avatars.length)];
};

// Função para selecionar uma resposta aleatória
const getRandomResponse = (): string => {
  return responses[Math.floor(Math.random() * responses.length)];
};

// Função para verificar se a mensagem do usuário contém palavras-chave
const getKeywordResponse = (userMessage: string): string | null => {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const [keyword, possibleResponses] of Object.entries(keywordResponses)) {
    if (lowerMessage.includes(keyword)) {
      return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }
  }
  
  return null;
};

// Função principal para gerar uma resposta de IA
export const generateAIResponse = (userMessage: string, existingMessages: ChatMessage[]): ChatMessage => {
  // Verificar se a mensagem do usuário contém palavras-chave
  const keywordResponse = getKeywordResponse(userMessage);
  
  // Usar resposta baseada em palavra-chave ou resposta aleatória
  const responseText = keywordResponse || getRandomResponse();
  
  // Evitar que o mesmo bot responda consecutivamente
  let botName = getRandomBotName();
  if (existingMessages.length > 0) {
    const lastSender = existingMessages[existingMessages.length - 1].sender;
    while (botName === lastSender) {
      botName = getRandomBotName();
    }
  }
  
  return {
    id: Date.now(),
    sender: botName,
    message: responseText,
    avatar: getRandomAvatar(),
    timestamp: new Date()
  };
};

// Função para simular várias mensagens de IA em intervalos aleatórios
export const simulateChat = (
  onNewMessage: (message: ChatMessage) => void,
  minInterval = 5000,
  maxInterval = 15000
) => {
  // Gerar um intervalo aleatório entre minInterval e maxInterval
  const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
  
  const timeoutId = setTimeout(() => {
    // Criar uma mensagem aleatória
    const botMessage: ChatMessage = {
      id: Date.now(),
      sender: getRandomBotName(),
      message: getRandomResponse(),
      avatar: getRandomAvatar(),
      timestamp: new Date()
    };
    
    // Enviar a mensagem
    onNewMessage(botMessage);
    
    // Configurar a próxima mensagem
    simulateChat(onNewMessage, minInterval, maxInterval);
  }, interval);
  
  // Retornar o ID do timeout para que possa ser cancelado se necessário
  return timeoutId;
};

// Função para parar a simulação
export const stopChatSimulation = (timeoutId: number) => {
  clearTimeout(timeoutId);
};
