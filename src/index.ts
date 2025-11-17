import express from 'express';
import expressEjsLayouts from 'express-ejs-layouts';
import cookieParser from "cookie-parser";
import path from 'path';
import logger from "morgan";
import * as routes from "./routes/index"

const app = express();
const port = process.env.PORT || 3000;

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

routes.register(app)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});