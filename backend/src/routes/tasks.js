'use strict';
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const logger = require('../utils/logger');

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks — retrieve all tasks for authenticated user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    logger.error(`Error fetching tasks: ${err.message}`);
    return res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// POST /api/tasks — create new task
router.post('/', async (req, res) => {
  try {
    const { title, note = '' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = new Task({
      userId: req.user.userId,
      title: title.trim(),
      note: (note || '').trim(),
      completed: false,
    });

    await task.save();
    return res.status(201).json({ success: true, task });
  } catch (err) {
    logger.error(`Error creating task: ${err.message}`);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id — update task (toggle, edit title or note)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, note } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (typeof title === 'string' && title.trim()) {
      task.title = title.trim();
    }
    if (typeof completed === 'boolean') {
      task.completed = completed;
    }
    if (typeof note === 'string') {
      task.note = note.trim();
    }
    task.updatedAt = new Date();

    await task.save();
    return res.status(200).json({ success: true, task });
  } catch (err) {
    logger.error(`Error updating task ${req.params.id}: ${err.message}`);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting task ${req.params.id}: ${err.message}`);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
