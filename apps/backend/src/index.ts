import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Placeholder for future Supabase or database routes
app.get('/api/products', (req, res) => {
  res.json({ message: 'Products endpoint skeleton' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
