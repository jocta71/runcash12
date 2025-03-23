const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateCreateEvent, validateUpdateEvent, validateIdParam } = require('../middleware/validateEvent');

/**
 * @route   GET /api/events
 * @desc    Obter todos os eventos
 * @access  Público
 */
router.get('/', eventController.getAllEvents);

/**
 * @route   GET /api/events/upcoming
 * @desc    Obter eventos futuros
 * @access  Público
 */
router.get('/upcoming', eventController.getUpcomingEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Obter evento por ID
 * @access  Público
 */
router.get('/:id', validateIdParam, eventController.getEventById);

/**
 * @route   POST /api/events
 * @desc    Criar um novo evento
 * @access  Público
 */
router.post('/', validateCreateEvent, eventController.createEvent);

/**
 * @route   PUT /api/events/:id
 * @desc    Atualizar um evento
 * @access  Público
 */
router.put('/:id', validateIdParam, validateUpdateEvent, eventController.updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Excluir um evento
 * @access  Público
 */
router.delete('/:id', validateIdParam, eventController.deleteEvent);

module.exports = router; 