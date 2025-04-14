const getCryptoDetails = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Fetching details for crypto ID:', id);
        
        // Fetch data from CoinLore API for the specific cryptocurrency
        const response = await fetch(`https://api.coinlore.net/api/ticker/?id=${id}`);
        if (!response.ok) {
            throw new Error(`CoinLore API error: ${response.status}`);
        }
        const data = await response.json();
        console.log('CoinLore response:', data);
        
        if (!data || data.length === 0) {
            console.log('No data found for ID:', id);
            return res.status(404).render('error', { message: 'Cryptocurrency not found' });
        }
        
        const crypto = data[0];
        console.log('CoinLore data:', crypto);
        
        // Fetch additional data from CoinGecko API
        const geckoResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.symbol.toLowerCase()}`);
        if (!geckoResponse.ok) {
            console.log('CoinGecko API error:', geckoResponse.status);
            // If CoinGecko fails, still render with CoinLore data
            return res.render('cryptocurrency/details', {
                crypto: {
                    ...crypto,
                    logo: null,
                    description: 'No additional information available',
                    market_data: {
                        current_price: { usd: crypto.price_usd },
                        market_cap: { usd: crypto.market_cap_usd },
                        total_volume: { usd: crypto.volume24 },
                        price_change_percentage_24h: crypto.percent_change_24h
                    }
                },
                userInSession: req.session.currentUser
            });
        }
        
        const geckoData = await geckoResponse.json();
        console.log('CoinGecko data:', geckoData);
        
        // Combine the data
        const cryptoDetails = {
            ...crypto,
            logo: geckoData.image?.large || null,
            description: geckoData.description?.en || 'No description available',
            market_data: {
                current_price: geckoData.market_data?.current_price || { usd: crypto.price_usd },
                market_cap: geckoData.market_data?.market_cap || { usd: crypto.market_cap_usd },
                total_volume: geckoData.market_data?.total_volume || { usd: crypto.volume24 },
                price_change_percentage_24h: geckoData.market_data?.price_change_percentage_24h || crypto.percent_change_24h
            }
        };
        
        console.log('Final crypto details:', cryptoDetails);
        
        res.render('cryptocurrency/details', {
            crypto: cryptoDetails,
            userInSession: req.session.currentUser
        });
    } catch (error) {
        console.error('Error fetching cryptocurrency details:', error);
        res.status(500).render('error', { 
            message: 'Error fetching cryptocurrency details',
            error: error.message 
        });
    }
};

const getCryptoList = async (req, res) => {
    try {
        // Convert start to a number and ensure it's not negative
        const start = Math.max(0, Number(req.params.start) || 0);
        const limit = 100; // Number of coins per page
        console.log('Fetching coins with offset:', start);
        
        // Fetch data from CoinLore API
        const response = await fetch(`https://api.coinlore.net/api/tickers/?start=${start}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`CoinLore API error: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || !data.data) {
            throw new Error('Invalid data format from CoinLore API');
        }

        // Clean and validate the data
        const cleanedData = data.data.map(coin => {
            // Clean market cap and volume
            const marketCap = parseFloat(coin.market_cap_usd);
            const volume = parseFloat(coin.volume24);
            const price = parseFloat(coin.price_usd);
            
            // Clean supply values
            const csupply = parseFloat(coin.csupply);
            const tsupply = parseFloat(coin.tsupply);
            const msupply = coin.msupply ? parseFloat(coin.msupply) : null;

            // Clean percentage changes
            const change24h = parseFloat(coin.percent_change_24h);
            const change1h = parseFloat(coin.percent_change_1h);
            const change7d = parseFloat(coin.percent_change_7d);

            return {
                ...coin,
                market_cap_usd: isNaN(marketCap) ? '0' : marketCap.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                volume24: isNaN(volume) ? '0' : volume.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                price_usd: isNaN(price) ? '0' : price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                csupply: isNaN(csupply) ? '0' : csupply.toLocaleString(),
                tsupply: isNaN(tsupply) ? '0' : tsupply.toLocaleString(),
                msupply: msupply ? msupply.toLocaleString() : 'N/A',
                percent_change_24h: isNaN(change24h) ? '0.00' : change24h.toFixed(2),
                percent_change_1h: isNaN(change1h) ? '0.00' : change1h.toFixed(2),
                percent_change_7d: isNaN(change7d) ? '0.00' : change7d.toFixed(2)
            };
        });
        
        // Fetch data from CoinGecko API for logos
        const geckoResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false');
        if (!geckoResponse.ok) {
            console.log('CoinGecko API error:', geckoResponse.status);
            return res.render('cryptocurrency/list', {
                coins: { data: cleanedData.map(coin => ({ ...coin, logo: null })) },
                start,
                nextStart: start + limit,
                prevStart: Math.max(0, start - limit),
                userInSession: req.session.currentUser
            });
        }
        
        const geckoData = await geckoResponse.json();
        
        // Map CoinGecko data to CoinLore data by symbol
        const geckoMap = {};
        geckoData.forEach(coin => {
            geckoMap[coin.symbol.toLowerCase()] = coin.image;
        });
        
        // Add logos to the cleaned data
        const coinsWithLogos = cleanedData.map(coin => {
            const symbol = coin.symbol.toLowerCase();
            return {
                ...coin,
                logo: geckoMap[symbol] || null
            };
        });
        
        res.render('cryptocurrency/list', {
            coins: { data: coinsWithLogos },
            start,
            nextStart: start + limit,
            prevStart: Math.max(0, start - limit),
            userInSession: req.session.currentUser
        });
    } catch (error) {
        console.error('Error in getCryptoList:', error);
        res.status(500).render('error', { 
            message: 'Error fetching cryptocurrency data',
            error: error.message 
        });
    }
};

const addFavorite = async (req, res) => {
    try {
        const { apiID, name, symbol, price_usd, percent_change_24h, percent_change_1h, percent_change_7d, csupply, market_cap_usd } = req.body;
        
        // Find the user
        const user = await User.findById(req.session.currentUser._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the cryptocurrency is already in favorites
        const existingFavorite = user.favorites.find(fav => fav.apiID === apiID);
        if (existingFavorite) {
            return res.redirect('/cryptocurrency/0?message=This cryptocurrency is already in your favorites');
        }

        // Add the new favorite
        user.favorites.push({
            apiID,
            name,
            symbol,
            price_usd,
            percent_change_24h,
            percent_change_1h,
            percent_change_7d,
            csupply,
            market_cap_usd
        });

        await user.save();

        res.redirect('/cryptocurrency/0?message=Cryptocurrency added to favorites successfully');
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).redirect('/cryptocurrency/0?message=Error adding cryptocurrency to favorites');
    }
};

const User = require('../models/User.model');

module.exports = {
    getCryptoDetails,
    getCryptoList,
    addFavorite
}; 