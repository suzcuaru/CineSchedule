
import { LocalDB } from '../backend/database';
import { formatDate } from './dataService';

export const seedMockData = async () => {
    // Generate 5 Halls
    const halls = [
        { id: 1, name: "1 (Большой)", category_id: 1 },
        { id: 2, name: "2", category_id: 2 },
        { id: 3, name: "3 (VIP)", category_id: 3 },
        { id: 4, name: "4", category_id: 2 },
        { id: 5, name: "5", category_id: 2 }
    ];

    const categories = [
        { id: 1, name: "IMAX" },
        { id: 2, name: "Standard" },
        { id: 3, name: "VIP Lounge" }
    ];

    const formats = [
        { id: 1, name: "2D" },
        { id: 2, name: "3D" },
        { id: 3, name: "ATMOS" }
    ];

    const movies = [
        { id: 101, name: "Гладиатор II", duration: 150, age_limit: 18, genres: ["Action", "Drama"], date_start: "2024-11-01", description: "Продолжение эпической саги Ридли Скотта о чести, мести и борьбе за Рим." },
        { id: 102, name: "Веном: Последний танец", duration: 110, age_limit: 16, genres: ["Sci-Fi", "Action"], date_start: "2024-10-24", description: "Эдди и Веном в бегах. Преследуемые обоими мирами, они вынуждены принять судьбоносное решение." },
        { id: 103, name: "Улыбка 2", duration: 127, age_limit: 18, genres: ["Horror"], date_start: "2024-10-18", description: "Мировая поп-звезда Скай Райли начинает испытывать ряд необъяснимых и пугающих событий." },
        { id: 104, name: "Дикий робот", duration: 102, age_limit: 6, genres: ["Animation", "Adventure"], date_start: "2024-10-17", description: "Робот Роз терпит крушение на необитаемом острове и должен адаптироваться к суровой среде." },
        { id: 105, name: "Джокер: Безумие на двоих", duration: 138, age_limit: 18, genres: ["Musical", "Drama"], date_start: "2024-10-04", description: "Артур Флек ждет суда в Аркхеме, где встречает любовь всей своей жизни — Харли Квинн." },
        { id: 106, name: "Субстанция", duration: 140, age_limit: 18, genres: ["Horror", "Satire"], date_start: "2024-09-19", description: "Забытая звезда решает принять инновационный препарат, который создает её молодую копию." },
        { id: 107, name: "Дюна: Часть вторая", duration: 166, age_limit: 12, genres: ["Sci-Fi", "Epic"], date_start: "2024-03-01", description: "Пол Атрейдес объединяется с Чани и фрименами, чтобы отомстить заговорщикам." },
        { id: 108, name: "Дэдпул и Росомаха", duration: 127, age_limit: 18, genres: ["Action", "Comedy"], date_start: "2024-07-26", description: "Уэйд Уилсон объединяется с неохотным Росомахой, чтобы спасти свою вселенную." },
        { id: 109, name: "Головоломка 2", duration: 96, age_limit: 6, genres: ["Animation", "Family"], date_start: "2024-06-14", description: "Райли стала подростком, и в её штаб-квартире появляются новые эмоции, включая Тревожность." },
        { id: 110, name: "Чужой: Ромул", duration: 119, age_limit: 18, genres: ["Horror", "Sci-Fi"], date_start: "2024-08-16", description: "Группа колонистов сталкивается с самой ужасающей формой жизни во вселенной на заброшенной станции." },
        { id: 111, name: "Охотники за привидениями: Леденящий ужас", duration: 115, age_limit: 12, genres: ["Fantasy", "Comedy"], date_start: "2024-03-22", description: "Семья Спенглер возвращается в Нью-Йорк, чтобы сразиться с древним злом, грозящим вторым ледниковым периодом." },
        { id: 112, name: "Планета обезьян: Новое царство", duration: 145, age_limit: 12, genres: ["Action", "Sci-Fi"], date_start: "2024-05-10", description: "Спустя много лет после правления Цезаря молодая обезьяна отправляется в путешествие, которое изменит будущее." },
        { id: 113, name: "Каскадеры", duration: 126, age_limit: 12, genres: ["Action", "Romance"], date_start: "2024-05-03", description: "Побитый жизнью каскадер должен найти пропавшую кинозвезду и раскрыть заговор." },
        { id: 114, name: "Министерство неджентльменских дел", duration: 120, age_limit: 18, genres: ["War", "Action"], date_start: "2024-04-19", description: "Секретное британское подразделение времен ВОВ отправляется на дерзкую миссию против нацистов." },
        { id: 115, name: "Битлджус Битлджус", duration: 104, age_limit: 12, genres: ["Fantasy", "Comedy"], date_start: "2024-09-06", description: "Спустя десятилетия Битлджус возвращается, чтобы снова устроить хаос в жизни семьи Дитц." },
        { id: 116, name: "Озеро страха: Наследие", duration: 92, age_limit: 16, genres: ["Thriller"], date_start: "2024-12-12", description: "Группа эко-активистов обнаруживает, что легендарное чудовище все еще живет в глубинах озера." },
        { id: 117, name: "Мегалополис", duration: 138, age_limit: 18, genres: ["Sci-Fi", "Drama"], date_start: "2024-09-27", description: "Архитектор-визионер хочет восстановить разрушенный мегаполис как утопию." },
        { id: 118, name: "Анора", duration: 139, age_limit: 18, genres: ["Comedy", "Drama"], date_start: "2024-10-17", description: "История любви между американской секс-работницей и сыном российского олигарха." },
        { id: 119, name: "Ужасающий 3", duration: 125, age_limit: 18, genres: ["Horror", "Slasher"], date_start: "2024-10-10", description: "Клоун Арт возвращается, чтобы превратить Рождество в кровавый кошмар." },
        { id: 120, name: "Руки Вверх!", duration: 110, age_limit: 12, genres: ["Biographical", "Music"], date_start: "2024-10-10", description: "История становления легендарной российской поп-группы." }
    ];

    const today = new Date();
    const shows = [];
    const tickets = [];
    const advertisements = [];

    // Create a week of shows
    for (let day = -2; day < 7; day++) {
        const d = new Date(today);
        d.setDate(d.getDate() + day);
        const dateStr = formatDate(d);

        for (const hall of halls) {
            let hour = 10;
            for (let i = 0; i < 4; i++) {
                const movie = movies[Math.floor(Math.random() * movies.length)];
                const showId = `mock_${dateStr}_${hall.id}_${i}`;
                
                shows.push({
                    id: showId,
                    movie_id: movie.id,
                    hall_id: hall.id,
                    format_id: formats[Math.floor(Math.random() * formats.length)].id,
                    date: dateStr,
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    content_status: Math.random() > 0.3 ? 'ready_hall' : 'no_keys'
                });

                tickets.push({
                    show_id: showId,
                    count: Math.floor(Math.random() * 120)
                });

                // Добавляем рекламу для каждого сеанса
                const adCount = Math.floor(Math.random() * 4) + 1; // 1-4 рекламы
                const ads = [];
                const adDurations = [30, 45, 60, 90]; // секунды
                const adNames = ['Coca-Cola', 'Samsung', 'Nike', 'McDonalds', 'BMW', 'Apple'];
                
                for (let j = 0; j < adCount; j++) {
                    ads.push({
                        name: adNames[j % adNames.length] + ' - Реклама',
                        duration: adDurations[Math.floor(Math.random() * adDurations.length)]
                    });
                }
                
                advertisements.push({
                    show_id: showId,
                    advertisements: ads
                });

                hour += 3;
            }
        }
    }

    const sheets = movies.map((m, idx) => ({
        "Дата начала релиза": "15 октября 2024",
        "Название кинофильма": m.name,
        "Продолжительность": `${Math.floor(m.duration / 60)}:${(m.duration % 60).toString().padStart(2, '0')}:00`,
        "Вшитые трейлеры": "00:05:00",
        "Свет ON 100% (с начала)": `${Math.floor(m.duration / 60)}:${(m.duration % 60).toString().padStart(2, '0')}:00`,
        "Свет ON 50% (с конца)": "00:03:00",
        "Свет ON 100% (с конца)": "00:08:00",
        "Начало чёрных титров": "",
        "Ссылки, торренты, комментарии": "",
        "Наименование DCP-пакета": `${m.name.replace(/\s/g, '_').substring(0, 8)}_FTR_S_RU-RU_51_2K_2024101${idx % 10}_OV`,
        "ПУ": `11105082${idx}`,
        "Дата выдачи ПУ": "01.10.2024",
        "Доставка": "DCP24",
        "_row_number": idx + 2
    }));

    await LocalDB.clearAndSave('halls', halls);
    await LocalDB.clearAndSave('hall_categories', categories);
    await LocalDB.clearAndSave('formats', formats);
    await LocalDB.clearAndSave('movies', movies);
    await LocalDB.clearAndSave('shows', shows);
    await LocalDB.clearAndSave('tickets', tickets);
    await LocalDB.clearAndSave('google_sheets', sheets);
    await LocalDB.clearAndSave('advertisements', advertisements);
};
