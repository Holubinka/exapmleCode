import { config } from 'dotenv';

config();

const constants = {
  dbUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
};

export default constants;
