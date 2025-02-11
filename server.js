import express from 'express';
import cors from 'cors';

const app = express();

import krogerRoutes from './routes/kroger.js';
import walmartRoutes from './routes/walmart.js';

app.use(cors());
app.use(express.json());

app.use('/kroger', krogerRoutes);
app.use('/walmart', walmartRoutes);

app.get('/', (req, res) => {
    res.send('Hello server');
});

const PORT = process.env.PORT ||5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});