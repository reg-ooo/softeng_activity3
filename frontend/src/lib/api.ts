import axios from 'axios'

/** Shared HTTP client for future Spring Boot API calls. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
})
