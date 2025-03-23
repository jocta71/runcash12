const Item = require('../models/Item');

/**
 * Item Controller
 * Contains all the business logic for item operations
 */
const itemController = {
  // Get all items
  getAllItems: async (req, res) => {
    try {
      const items = await Item.getAll();
      res.json(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Get item by ID
  getItemById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await Item.getById(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json(item);
    } catch (err) {
      console.error('Error fetching item:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Create a new item
  createItem: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Validate input
      if (!name || !description) {
        return res.status(400).json({ error: 'Please provide name and description' });
      }
      
      const newItem = await Item.create({ name, description });
      res.status(201).json(newItem);
    } catch (err) {
      console.error('Error creating item:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Update an existing item
  updateItem: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      // Validate input
      if (!name && !description) {
        return res.status(400).json({ error: 'Please provide name or description to update' });
      }
      
      const updatedItem = await Item.update(id, { name, description });
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (err) {
      console.error('Error updating item:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
  
  // Delete an item
  deleteItem: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await Item.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json({ message: `Item ${id} deleted successfully` });
    } catch (err) {
      console.error('Error deleting item:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = itemController; 