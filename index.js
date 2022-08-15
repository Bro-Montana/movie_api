const express = require('express'),
    morgan = require('morgan');

const app = express();

let topMovies = [
    {
        title: 'Friday',
        writer: 'Ice Cube'
    },
    {
        title: 'All About the Benjamins',
        writer: 'Ice Cube'
    },
    {
        title: 'The Players Club',
        writer: 'Ice Cube'
    },
    {
        title: 'Friday After Next',
        writer: 'Ice Cube'
    }
];

app.use(morgan('common'));

app.get("/movies", (req, res) => {
    res.json(topMovies);
});

app.get("/", (req, res) => {
    res.send('What Up!');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something is not working!');
  });

app.listen(8080, () => {
    console.log('App is listening...hopefully!');
});