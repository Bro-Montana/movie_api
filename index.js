const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    uuid = require('uuid'), 
    mongoose = require('mongoose'),
    morgan = require('morgan');

const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const { check, validationResult } = require('express-validator');

const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport'); 

//Locally hosted db below 
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true});

//remotely hosted db
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true});

app.get('/', (req, res)=> {
    res.send('it is working!')
});
    

//create username
app.post('/users',
[
    check('Username', 'Username is required').isLength({ min: 5}), //username is required minimum of 5 characters
    check('Username', 'Username not allowed  to contain non alpha characters').isAlphanumeric(), // alphanumeric char only
    check('Password', 'Password is required').not().isEmpty(), // confirms password field is not empty
    check('Email', 'Email is not valid').isEmail() // check email validity
],
(req, res) => {

    //check validation for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashedPassword(req.body.Password); // password hashing
    Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create ({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => { res.status(201).json(user) })
                .catch(( error ) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

//Get all users
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOne({ Username: req.params.Username })
		.then((user) => {
			res.json(user);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// update a user's info, by username
app.put('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
			$set: {
				Username: req.body.Username,
				Password: req.body.Password,
				Email: req.body.Email,
				Birthday: req.body.Birthday,
			},
		},
		{ new: true },
		(err, updatedUser) => {
			if (err) {
				console.error(err);
				res.status(500).send('Error: ' + err);
			} else {
				res.json(updatedUser);
			}
		}
	);
});



//create (add) movie to favorites array by ID 
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
			$push: { FavoriteMovies: req.params.MovieID },
		},
		{ new: true },
		(err, updatedUser) => {
			if (err) {
				console.error(err);
				res.status(500).send('Error: ' + err);
			} else {
				res.json(updatedUser);
			}
		}
	);
});

//Remove movie from user favorites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), ( req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true },
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});



//delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOneAndRemove({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				res.status(400).send(req.params.Username + ' was not found');
			} else {
				res.status(200).send(req.params.Username + ' was deleted.');
			}
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});


//read - get all movies
app.get('/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
	Movies.find()
		.then((movies) => {
			res.status(200).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//read - get movies by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false}), (req, res) => {
	Movies.findOne({ Title: req.params.Title })
		.then((movie) => {
			res.json(movie);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//read - get genre info by genre name 
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false}), (req, res) => {
	Movies.findOne({ 'Genre.Name': req.params.genreName })
		.then((movie) => {
			res.json(movie.Genre);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
                   

//read - get director info
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false}), (req, res) => {
	Movies.findOne({ 'Director.Name': req.params.directorName })
		.then((movie) => {
			res.json(movie.Director);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//error handle
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something isn't right");
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});


// app.listen(8080, () => {
//     console.log('App is listening on 8080...hopefully!');
// });



