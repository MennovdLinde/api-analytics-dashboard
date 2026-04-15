import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
export const api = axios.create({ baseURL: BASE_URL });

export type Window = '1h' | '24h' | '7d';
