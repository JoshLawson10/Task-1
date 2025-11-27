import express from 'express';
import expressEjsLayouts from 'express-ejs-layouts';
import cookieParser from "cookie-parser";
import path from 'path';
import logger from "morgan";
import * as routes from "./routes/index"

const app = express();
const port = process.env.PORT || 3000;

// ---------- Database Init ----------
import { db, database, initDatabase } from '@config/database';

initDatabase();
app.locals.db = db;
app.locals.database = database;

// ---------- CORS Middleware ----------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ---------- Middleware & View Engine ----------
app.set('port', port);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(expressEjsLayouts)
app.set('layout','layouts/layout');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname,'public')));

// ---------- Routes ----------
routes.register(app)

// ---------- Errors and 404 Handling ----------
app.use((req, res, next) => {
  const err = new Error('Not Found');
  (err as any).status = 404;
  next(err);
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// ---------- Server Setup ----------
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;