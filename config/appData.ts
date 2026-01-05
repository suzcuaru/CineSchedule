// ЭТОТ ФАЙЛ СОДЕРЖИТ ВСЮ ИНФОРМАЦИЮ О ВЕРСИЯХ И КОНТАКТАХ
// Редактируйте этот файл, чтобы обновить данные в приложении.

export const APP_INFO = {
  version: "v3.0.2",
  build: "BETA",
  developer: "Suzcuaru",
  supportEmail: "https://t.me/+7t0HIRR20gBlOTZi",
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