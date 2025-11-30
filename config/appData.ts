// ЭТОТ ФАЙЛ СОДЕРЖИТ ВСЮ ИНФОРМАЦИЮ О ВЕРСИЯХ И КОНТАКТАХ
// Редактируйте этот файл, чтобы обновить данные в приложении.

export const APP_INFO = {
  version: "v2.6.0",
  build: "Build bd7e291",
  developer: "Suzcuaru",
  supportEmail: "support@cinetech.ru",
  website: "cinetech.ru",
  githubProfileUrl: "https://github.com/suzcuaru",
  githubRepo: "suzcuaru/CineSchedule" // e.g. "user/repo"
};

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'Major' | 'Feature' | 'Patch' | 'Hotfix';
  changes: string[];
}