const Event = require('../models/Event');

/**
 * Controlador de Eventos
 * Contém toda a lógica de negócios para operações com eventos
 */
const eventController = {
  // Obter todos os eventos
  getAllEvents: async (req, res) => {
    try {
      const events = await Event.getAll();
      res.json(events);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  },
  
  // Obter eventos futuros
  getUpcomingEvents: async (req, res) => {
    try {
      const events = await Event.getUpcoming();
      res.json(events);
    } catch (err) {
      console.error('Erro ao buscar eventos futuros:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  },
  
  // Obter evento por ID
  getEventById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await Event.getById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      res.json(event);
    } catch (err) {
      console.error('Erro ao buscar evento:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  },
  
  // Criar um novo evento
  createEvent: async (req, res) => {
    try {
      const { title, description, date, location } = req.body;
      
      // Validar entrada
      if (!title || !description || !date) {
        return res.status(400).json({ error: 'Por favor, forneça título, descrição e data' });
      }
      
      // Validação simples de data
      if (isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Formato de data inválido. Por favor, use o formato ISO 8601 (ex: YYYY-MM-DDTHH:MM:SS.sssZ)' });
      }
      
      const newEvent = await Event.create({ 
        title, 
        description, 
        date,
        location: location || 'A definir'
      });
      
      res.status(201).json(newEvent);
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  },
  
  // Atualizar um evento existente
  updateEvent: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, date, location } = req.body;
      
      // Validar entrada
      if (!title && !description && !date && !location) {
        return res.status(400).json({ error: 'Por favor, forneça pelo menos um campo para atualizar' });
      }
      
      // Validação simples de data se a data for fornecida
      if (date && isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Formato de data inválido. Por favor, use o formato ISO 8601 (ex: YYYY-MM-DDTHH:MM:SS.sssZ)' });
      }
      
      const updatedEvent = await Event.update(id, { 
        ...(title && { title }),
        ...(description && { description }),
        ...(date && { date }),
        ...(location && { location })
      });
      
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      res.json(updatedEvent);
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  },
  
  // Excluir um evento
  deleteEvent: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await Event.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }
      
      res.json({ message: `Evento ${id} excluído com sucesso` });
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }
};

module.exports = eventController; 