/**
 * Item Model
 * 
 * In a real application, this would use a database ORM like Sequelize or Mongoose
 * For simplicity, we're using a local in-memory store
 */

// Simulating a database with an in-memory array
let items = [
  { id: 1, name: 'Item 1', description: 'Description for item 1', createdAt: new Date().toISOString() },
  { id: 2, name: 'Item 2', description: 'Description for item 2', createdAt: new Date().toISOString() },
  { id: 3, name: 'Item 3', description: 'Description for item 3', createdAt: new Date().toISOString() },
];

// Get next ID for new items
const getNextId = () => {
  const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
  return maxId + 1;
};

// Item model methods
const Item = {
  // Get all items
  getAll: () => {
    return Promise.resolve([...items]);
  },
  
  // Get item by ID
  getById: (id) => {
    const item = items.find(item => item.id === id);
    return Promise.resolve(item || null);
  },
  
  // Create new item
  create: (itemData) => {
    const newItem = {
      id: getNextId(),
      ...itemData,
      createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    return Promise.resolve(newItem);
  },
  
  // Update existing item
  update: (id, itemData) => {
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return Promise.resolve(null);
    }
    
    const updatedItem = {
      ...items[index],
      ...itemData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    items[index] = updatedItem;
    return Promise.resolve(updatedItem);
  },
  
  // Delete item
  delete: (id) => {
    const initialLength = items.length;
    items = items.filter(item => item.id !== id);
    
    const deleted = initialLength > items.length;
    return Promise.resolve(deleted);
  }
};

module.exports = Item; 