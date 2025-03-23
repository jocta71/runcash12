/**
 * Validation middleware for Item data
 */

// Validate item creation data
const validateCreateItem = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];
  
  if (!name) {
    errors.push('Name is required');
  } else if (typeof name !== 'string') {
    errors.push('Name must be a string');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!description) {
    errors.push('Description is required');
  } else if (typeof description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: 'Validation failed', errors } });
  }
  
  next();
};

// Validate item update data
const validateUpdateItem = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];
  
  // If both are absent, that's an error
  if (!name && !description) {
    errors.push('At least one field (name or description) must be provided');
  }
  
  // If name is present, validate it
  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push('Name must be a string');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
  }
  
  // If description is present, validate it
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: 'Validation failed', errors } });
  }
  
  next();
};

// Validate ID param
const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: { message: 'Invalid ID parameter' } });
  }
  
  // Add the parsed ID to req for controllers to use
  req.itemId = id;
  next();
};

module.exports = {
  validateCreateItem,
  validateUpdateItem,
  validateIdParam
}; 