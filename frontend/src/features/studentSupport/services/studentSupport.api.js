import { httpClient } from '../../../services/httpClient.js';

export const studentSupportApi = Object.freeze({
  mine: () => httpClient.get('/students/me'),
  link: (registrationNumber) =>
    httpClient.post('/students/claim', { registrationNumber: registrationNumber.trim().toUpperCase() })
});
