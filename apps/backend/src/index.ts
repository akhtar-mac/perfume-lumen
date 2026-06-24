import dotenv from 'dotenv';
import { app, logger } from './app';

dotenv.config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});