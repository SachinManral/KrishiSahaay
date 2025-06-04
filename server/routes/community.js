const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/community/posts
// @desc    Get community posts
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    // Placeholder data - replace with actual database query
    const posts = [
      { 
        id: 1, 
        title: 'Best practices for rice cultivation', 
        content: 'I have been growing rice for 10 years and wanted to share some tips...',
        author: 'Farmer Ramesh',
        date: '2023-05-15',
        likes: 24,
        comments: 8
      },
      { 
        id: 2, 
        title: 'Dealing with wheat rust', 
        content: 'Has anyone found an effective solution for wheat rust this season?',
        author: 'Farmer Suresh',
        date: '2023-05-12',
        likes: 18,
        comments: 15
      },
      { 
        id: 3, 
        title: 'New government subsidy program', 
        content: 'The government has announced a new subsidy program for organic farming...',
        author: 'AgriNews',
        date: '2023-05-10',
        likes: 45,
        comments: 12
      }
    ];
    
    res.json(posts);
  } catch (err) {
    console.error('Error fetching community posts:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/community/posts
// @desc    Create a post
// @access  Private
router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }
    
    // Placeholder response - replace with actual database insertion
    res.json({ 
      id: Math.floor(Math.random() * 1000),
      title,
      content,
      author: 'Current User',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: 0
    });
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;