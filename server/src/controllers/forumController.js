const ForumPost = require('../models/Forum');
const User = require('../models/User');

// Create a new forum post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const authorId = req.user.userId;

    const post = new ForumPost({
      author: authorId,
      title,
      content,
      category,
      tags
    });

    await post.save();
    await post.populate('author', 'username');
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all forum posts with pagination
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = category ? { category } : {};

    const posts = await ForumPost.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ForumPost.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment to a post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: authorId,
      content
    };

    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'username');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle like on a post
exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single post with comments
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findById(postId)
      .populate('author', 'username')
      .populate('comments.author', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};