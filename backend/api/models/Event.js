/**
 * Modelo de Evento
 * 
 * Em uma aplicação real, isso usaria um ORM de banco de dados como Sequelize ou Mongoose
 * Para simplificar, estamos usando um armazenamento local em memória
 */

// Simulando um banco de dados com um array em memória
let events = [
  { 
    id: 1, 
    title: 'Evento 1', 
    description: 'Descrição do evento 1', 
    date: '2023-04-15T10:00:00.000Z',
    location: 'Online',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 2, 
    title: 'Evento 2', 
    description: 'Descrição do evento 2', 
    date: '2023-04-20T14:30:00.000Z',
    location: 'Sala de Conferência A',
    createdAt: new Date().toISOString() 
  },
  { 
    id: 3, 
    title: 'Evento 3', 
    description: 'Descrição do evento 3', 
    date: '2023-04-25T09:15:00.000Z',
    location: 'Reunião Virtual',
    createdAt: new Date().toISOString() 
  },
];

// Obter o próximo ID para novos eventos
const getNextId = () => {
  const maxId = events.reduce((max, event) => (event.id > max ? event.id : max), 0);
  return maxId + 1;
};

// Métodos do modelo de Evento
const Event = {
  // Obter todos os eventos
  getAll: () => {
    return Promise.resolve([...events]);
  },
  
  // Obter eventos após uma determinada data
  getUpcoming: () => {
    const now = new Date();
    return Promise.resolve(
      events
        .filter(event => new Date(event.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    );
  },
  
  // Obter evento por ID
  getById: (id) => {
    const event = events.find(event => event.id === id);
    return Promise.resolve(event || null);
  },
  
  // Criar novo evento
  create: (eventData) => {
    const newEvent = {
      id: getNextId(),
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    return Promise.resolve(newEvent);
  },
  
  // Atualizar evento existente
  update: (id, eventData) => {
    const index = events.findIndex(event => event.id === id);
    
    if (index === -1) {
      return Promise.resolve(null);
    }
    
    const updatedEvent = {
      ...events[index],
      ...eventData,
      id, // Garantir que o ID não mude
      updatedAt: new Date().toISOString()
    };
    
    events[index] = updatedEvent;
    return Promise.resolve(updatedEvent);
  },
  
  // Excluir evento
  delete: (id) => {
    const initialLength = events.length;
    events = events.filter(event => event.id !== id);
    
    const deleted = initialLength > events.length;
    return Promise.resolve(deleted);
  }
};

module.exports = Event; 