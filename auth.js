// key used in JWTStrategy
const jwtSecret = 'your_jwt_secret';

// const { Router } = require('express');
const jwt = require('jsonwebtoken'),
    passport = require('passport');


// my local passport file
require('./passport');


let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // username that is getting encoded
        expiresIn: '7d',        // this specifies that the token will expire in 7days
        algorithm: 'HS256'      // algorithm used to encode values of the JWT

    }); 
}

// Post login
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if (error) { 
                    res.send(error);
                }
            let token = generateJWTToken(user.toJSON());
            return res.json({ user, token });
            });
        })(req, res)
    });
}