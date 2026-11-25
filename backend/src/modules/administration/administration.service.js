import { administrationRepository } from './administration.repository.js';
export function createAdministrationService(repository = administrationRepository) { return { overview: () => repository.overview() }; }
export const administrationService = createAdministrationService();
