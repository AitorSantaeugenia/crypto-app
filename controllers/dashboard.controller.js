const User = require('../models/User.model');

const getDashboard = async (req, res) => {
    try {
        // Obtener el usuario con sus favoritos
        const user = await User.findById(req.session.currentUser._id);
        
        // Verificar si el usuario tiene favoritos
        const hasFavorites = user.favorites && user.favorites.length > 0;
        
        res.render('dashboard/index', {
            userInSession: req.session.currentUser,
            favorites: user.favorites,
            hasFavorites
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            error: error.message 
        });
    }
};

module.exports = {
    getDashboard
}; 