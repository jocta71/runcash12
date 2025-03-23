/**
 * Middleware de validação para dados de Evento
 */

// Validar dados de criação de evento
const validateCreateEvent = (req, res, next) => {
  const { title, description, date, location } = req.body;
  const errors = [];
  
  if (!title) {
    errors.push('Título é obrigatório');
  } else if (typeof title !== 'string') {
    errors.push('Título deve ser uma string');
  } else if (title.trim().length < 3) {
    errors.push('Título deve ter pelo menos 3 caracteres');
  }
  
  if (!description) {
    errors.push('Descrição é obrigatória');
  } else if (typeof description !== 'string') {
    errors.push('Descrição deve ser uma string');
  }
  
  if (!date) {
    errors.push('Data é obrigatória');
  } else if (isNaN(Date.parse(date))) {
    errors.push('Formato de data inválido. Por favor, use o formato ISO 8601 (ex: YYYY-MM-DDTHH:MM:SS.sssZ)');
  }
  
  if (location && typeof location !== 'string') {
    errors.push('Localização deve ser uma string');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: 'Falha na validação', errors } });
  }
  
  next();
};

// Validar dados de atualização de evento
const validateUpdateEvent = (req, res, next) => {
  const { title, description, date, location } = req.body;
  const errors = [];
  
  // Se todos estiverem ausentes, isso é um erro
  if (!title && !description && !date && !location) {
    errors.push('Pelo menos um campo (título, descrição, data ou localização) deve ser fornecido');
  }
  
  // Se o título estiver presente, valide-o
  if (title !== undefined) {
    if (typeof title !== 'string') {
      errors.push('Título deve ser uma string');
    } else if (title.trim().length < 3) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }
  }
  
  // Se a descrição estiver presente, valide-a
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('Descrição deve ser uma string');
    }
  }
  
  // Se a data estiver presente, valide-a
  if (date !== undefined) {
    if (isNaN(Date.parse(date))) {
      errors.push('Formato de data inválido. Por favor, use o formato ISO 8601 (ex: YYYY-MM-DDTHH:MM:SS.sssZ)');
    }
  }
  
  // Se a localização estiver presente, valide-a
  if (location !== undefined) {
    if (typeof location !== 'string') {
      errors.push('Localização deve ser uma string');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: 'Falha na validação', errors } });
  }
  
  next();
};

// Validar parâmetro ID
const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: { message: 'Parâmetro ID inválido' } });
  }
  
  // Adicionar o ID analisado ao req para uso dos controladores
  req.eventId = id;
  next();
};

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
  validateIdParam
}; 