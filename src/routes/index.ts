import * as express from 'express';

export const register = (app: express.Application) => {
    app.get('/', (req, res) => {
        res.render('index');
    });

    app.get('/about', (req, res) => {
        res.render('about');
    });
};