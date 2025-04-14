const express = require('express');
const router = express.Router();
const { getCryptoList, getCryptoDetails, addFavorite } = require('../controllers/cryptocurrency.controller');
const { isLoggedIn } = require('../middleware/route-guard');
const User = require('../models/User.model');

// IMPORTANTE: La ruta de detalles debe ir ANTES de la ruta con :start
// para evitar que se confunda con la paginación
router.get('/details/:id', async (req, res) => {
    try {
        const cryptoId = req.params.id;
        
        // Hacer la petición a la API de CoinLore para obtener los detalles
        const response = await fetch(`https://api.coinlore.net/api/ticker/?id=${cryptoId}`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            return res.status(404).render('error', { message: 'Cryptocurrency not found' });
        }

        const crypto = data[0];
        
        // Renderizar la vista de detalles con los datos
        res.render('cryptocurrency/details', {
            crypto,
            userInSession: req.session.currentUser
        });
    } catch (error) {
        console.error('Error fetching crypto details:', error);
        res.status(500).render('error', { message: 'Error fetching cryptocurrency details' });
    }
});

// Ruta para la lista de criptomonedas con paginación
router.get('/:start', getCryptoList);

// Ruta para añadir a favoritos
router.put('/add-favorite', isLoggedIn, async (req, res) => {
    try {
        const userId = req.session.currentUser._id;
        const cryptoData = req.body;
        
        // Primero verificamos si ya existe un favorito con el mismo apiID
        const existingUser = await User.findOne({
            _id: userId,
            'favorites.apiID': cryptoData.apiID
        });

        if (existingUser) {
            // Si ya existe, enviamos una respuesta indicándolo
            return res.status(400).json({
                success: false,
                message: 'This cryptocurrency is already in your favorites'
            });
        }

        // Si no existe, lo añadimos
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: { // $addToSet asegura que no haya duplicados
                    favorites: {
                        apiID: cryptoData.apiID,
                        name: cryptoData.name,
                        symbol: cryptoData.symbol,
                        price_usd: cryptoData.price_usd,
                        percent_change_24h: cryptoData.percent_change_24h,
                        percent_change_1h: cryptoData.percent_change_1h,
                        percent_change_7d: cryptoData.percent_change_7d,
                        csupply: cryptoData.csupply,
                        market_cap_usd: cryptoData.market_cap_usd
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Added to favorites'
        });

    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to favorites'
        });
    }
});

module.exports = router; 