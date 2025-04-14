const express = require('express');
const router = express.Router();
const User = require('../models/User.model.js');
const { isLoggedIn } = require('../middleware/route-guard');
const Comment = require('../models/Comment.model');

// Get dashboard
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.currentUser._id);
        const comments = await Comment.find({ userId: req.session.currentUser._id })
            .sort({ createdAt: -1 });
        
        res.render('dashboard', {
            userInSession: user,
            comments
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error');
    }
});

// Remove favorite
router.post('/remove-favorite', isLoggedIn, async (req, res) => {
    try {
        const { apiID } = req.body;
        const user = await User.findById(req.session.currentUser._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the favorite
        user.favorites = user.favorites.filter(fav => fav.apiID !== apiID);
        await user.save();

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).redirect('/dashboard?error=Error removing favorite');
    }
});

// Ruta para eliminar favorito
router.delete('/remove-favorite/:apiID', isLoggedIn, async (req, res) => {
    try {
        console.log('Removing favorite with apiID:', req.params.apiID);
        const userId = req.session.currentUser._id;
        const apiID = req.params.apiID;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    favorites: { apiID: apiID }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            console.log('User not found');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('Favorite removed successfully');
        res.json({
            success: true,
            message: 'Cryptocurrency removed from favorites'
        });

    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing favorite'
        });
    }
});

// Añadir comentario
router.post('/add-comment', isLoggedIn, async (req, res) => {
    try {
        // Log completo de los datos recibidos
        console.log('Request body:', req.body);
        console.log('User session:', req.session.currentUser);

        const { cryptoId, cryptoSymbol, cryptoName, text } = req.body;
        const userId = req.session.currentUser._id;

        // Verificar que todos los campos necesarios estén presentes
        if (!cryptoId || !cryptoSymbol || !cryptoName || !text) {
            console.log('Missing fields:', { cryptoId, cryptoSymbol, cryptoName, text });
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Crear el comentario
        const newComment = {
            userId,
            cryptoId,
            cryptoName,
            cryptoSymbol,
            text
        };

        console.log('Creating comment with data:', newComment);

        const comment = await Comment.create(newComment);

        console.log('Comment created successfully:', comment);
        
        res.json({
            success: true,
            comment,
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Error in add-comment route:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Eliminar comentario
router.delete('/delete-comment/:id', isLoggedIn, async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router; 