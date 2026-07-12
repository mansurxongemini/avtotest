// New Questions with Embedded Answers Structure
export const NewQuestions = [
    {
        id: 1,
        lesson: 1, // oraliq_dars - lesson number
        question: {
            uz: "Moped haydovchisi majbur:",
            ru: "Водитель мопеда обязан:", 
            cry: "Мопед ҳайдовчиси мажбур:"
        },
        image: "", // or "" if no image
        answers: [
            {
                id: 1,
                text: { 
                    uz: "16 yoshga to'lgan bo'lishi", 
                    ru: "16 лет должен быть", 
                    cry: "16 ёшга то'лган бўлиши" 
                },
                isCorrect: false
            },
            {
                id: 2,
                text: { 
                    uz: "Motoshlem kiyishlari va uni qadab olishlari", 
                    ru: "Необходимость носить мотошлем и его сохранность", 
                    cry: "Мотошлем киuишлари ва уни қадаб олиши" 
                },
                isCorrect: false
            },
            {
                id: 3,
                text: { 
                    uz: "Kunduzgi vaqtda ham yaqinni yorituvchi chiroqlarni yoqib yurishi", 
                    ru: "Днем и в светлое время суток нужно переключать дальний свет", 
                    cry: "Кундзи ва кундизида яқинни ёритувчи чироқларни ёқиб юриши" 
                },
                isCorrect: false
            },
            {
                id: 4,
                text: { 
                    uz: "Barcha sanab o'tilgan javoblar", 
                    ru: "Во всех перечисленных случаях", 
                    cry: "Барча санаб ўтилган жавоблар" 
                },
                isCorrect: true
            }
        ]
    },
    {
        id: 3,
        lesson: 1,
        question: {
            uz: "Qaysi avtomobil chorrahada burilish qoidasini buzdi?",
            ru: "Какая машина нарушила правило поворота на перекрестке?",
            cry: "Қайси автомобил чорраҳада бурилиш қоидасини бузди?"
        },
        image: "newImages/03.jpg",
        answers: [
            {
                id: 9,
                text: {
                    uz: "Qizil avtomobil",
                    ru: "Красная машина",
                    cry: "Қизил автомобил"
                },
                isCorrect: true
            },
            {
                id: 10,
                text: {
                    uz: "Ko'k avtomobil",
                    ru: "Синяя машина",
                    cry: "Кўк автомобил"
                },
                isCorrect: false
            },
            {
                id: 11,
                text: {
                    uz: "Har ikkisi ham buzdi",
                    ru: "Обе нарушили",
                    cry: "Ҳар иккиси ҳам бузди"
                },
                isCorrect: false
            },
            {
                id: 12,
                text: {
                    uz: "Har ikkisi ham buzmagan",
                    ru: "Обе не нарушили",
                    cry: "Ҳар иккиси ҳам бузмаган"
                },
                isCorrect: false
            }
        ]
    },
    {
        id: 4,
        lesson: 1,
        question: {
            uz: "O'quv muddati yakunida 'A' toifadagi mototransport vositasini boshqarish huquqiga ega bo'lish uchun necha yoshga to'lgan shaxslarga imtihonlar topshirishga ruxsat etiladi?",
            ru: "Лицам какого возраста разрешается сдавать экзамены для получения права управления транспортным средством категории 'A' по окончании обучения?",
            cry: "Ўқув муддати якунида 'А' тоифадаги мотotransport воситасини бошқариш ҳуқуқига эга бўлиш учун неча ёшга то'лган шаҳсларга имтиҳонлар топширишга рухсат этилади?"
        },
        image: "newImages/04.jpg",
        answers: [
            {
                id: 13,
                text: {
                    uz: "17 yoshga",
                    ru: "17 лет",
                    cry: "17 ёшга"
                },
                isCorrect: false
            },
            {
                id: 14,
                text: {
                    uz: "16 yoshga",
                    ru: "16 лет",
                    cry: "16 ёшга"
                },
                isCorrect: true
            },
            {
                id: 15,
                text: {
                    uz: "14 yoshga",
                    ru: "14 лет",
                    cry: "14 ёшга"
                },
                isCorrect: false
            },
            {
                id: 16,
                text: {
                    uz: "18 yoshga",
                    ru: "18 лет",
                    cry: "18 ёшга"
                },
                isCorrect: false
            },
            {
                id: 17,
                text: {
                    uz: "15 yoshga",
                    ru: "15 лет",
                    cry: "15 ёшга"
                },
                isCorrect: false
            }
        ]
    },
    {
        id: 5,
        lesson: 1,
        question: {
            uz: "Bu xavflilik belgisi qanday nomlanadi?",
            ru: "Как называется этот знак опасности?",
            cry: "Бу хавфлик белгиси қандай номланади?"
        },
        image: "newImages/05.jpg",
        answers: [
            {
                id: 18,
                text: {
                    uz: "Oksidlovchi moddalar",
                    ru: "Окисляющие вещества",
                    cry: "Оксидловчи моддалар"
                },
                isCorrect: false
            },
            {
                id: 19,
                text: {
                    uz: "Organik peroksidlar",
                    ru: "Органические пероксиды",
                    cry: "Органик пероксидлар"
                },
                isCorrect: true
            },
            {
                id: 20,
                text: {
                    uz: "Tez alangalanadigan gazlar va suyuqliklar",
                    ru: "Быстровоспламеняющиеся газы и жидкости",
                    cry: "Тез алангаланадиган газлар ва суюқликлар"
                },
                isCorrect: false
            }
        ]
    },
    {
        id: 6,
        lesson: 1,
        question: {
            uz: "Ushbu belgi qanday nomlanadi?",
            ru: "Как называется этот знак?",
            cry: "Ушбу белги қандай номланади?"
        },
        image: "newImages/06.jpg",
        answers: [
            {
                id: 21,
                text: {
                    uz: "Piyodalarning harakati taqiqlangan",
                    ru: "Движение пешеходов запрещено",
                    cry: "Пиёдаларнинг ҳаракати тақиқланган"
                },
                isCorrect: false
            },
            {
                id: 22,
                text: {
                    uz: "Individual harakatlanish vositalarini boshqarish taqiqlangan",
                    ru: "Управление индивидуальными транспортными средствами запрещено",
                    cry: "Индивидуал ҳаракатланиш воситаларини бошқариш тақиқланган"
                },
                isCorrect: true
            },
            {
                id: 23,
                text: {
                    uz: "Bolalar uchishi taqiqlangan",
                    ru: "Детские игры запрещены",
                    cry: "Болalar ўйини тақиқланган"
                },
                isCorrect: false
            },
            {
                id: 24,
                text: {
                    uz: "Ko'rsatilgan barcha javoblar to'g'ri",
                    ru: "Все указанные ответы правильные",
                    cry: "Кўрсатилган барча жавоблар тўғри"
                },
                isCorrect: false
            }
        ]
    },
    {
        id: 7,
        lesson: 1,
        question: {
            uz: "Bu belgi nimani bildiradi?",
            ru: "Что означает этот знак?",
            cry: "Бу белги нимани билдиради?"
        },
        image: "newImages/07.jpg",
        answers: [
            {
                id: 25,
                text: {
                    uz: "Oldinda tirbandlik borligini",
                    ru: "Наличие пробки впереди",
                    cry: "Олдинда тирbandлик борлигини"
                },
                isCorrect: false
            },
            {
                id: 26,
                text: {
                    uz: "Navbat bilan o'tishni",
                    ru: "Проезд по очереди",
                    cry: "Навбат билан ўтишни"
                },
                isCorrect: true
            },
            {
                id: 27,
                text: {
                    uz: "To'xtab turish joyiga borishni",
                    ru: "Направление к месту остановки",
                    cry: "Тўхтаб туриш жойига боришни"
                },
                isCorrect: false
            }
        ]
    },
    {
        id: 8,
        lesson: 1,
        question: {
            uz: "Ushbu kesishmadan o'ngga burilishga ruxsat beriladimi?",
            ru: "Разрешен ли поворот направо на этом перекрестке?",
            cry: "Ушбу кесишмадан ўнгга бурилишга рухсат бериладими?"
        },
        image: "newImages/08.jpg",
        answers: [
            {
                id: 28,
                text: {
                    uz: "Taqiqlanadi",
                    ru: "Запрещен",
                    cry: "Тақиқланади"
                },
                isCorrect: false
            },
            {
                id: 29,
                text: {
                    uz: "Ruxsat beriladi",
                    ru: "Разрешен",
                    cry: "Рухсат берилади"
                },
                isCorrect: true
            }
        ]
    },
    {
        id: 9,
        lesson: 1,
        question: {
            uz: "Tezkor va maxsus xizmatlarning transport vositalari yo'l harakatining boshqa qatnashchilariga nisbatan imtiyozga ega bo'lishi uchun:",
            ru: "Для того чтобы транспортные средства экстренных и специальных служб имели преимущество перед другими участниками дорожного движения:",
            cry: "Тезкор ва махсус хизматларнинг transport воситалари йўл ҳаракатининг бошқа қатнашчиларига нисбатан имтиёзга эга бўлиши учун:"
        },
        image: "",
        answers: [
            {
                id: 30,
                text: {
                    uz: "Ko'k yoki qizil yoxud ko'k va qizil rangli yalt-yalt etuvchi mayoqchalar yoqilgan bo'lishi shart",
                    ru: "Должны быть включены синие или красные, либо синие и красные мигающие маяки",
                    cry: "Кўк ёки қизил ёхуд кўк ва қизил рангли ялт-ялт этиб турадиган маёқчалар ёқилган бўлиши шарт"
                },
                isCorrect: false
            },
            {
                id: 31,
                text: {
                    uz: "Maxsus tovushli ishora yoqilgan bo'lishi shart",
                    ru: "Должна быть включена специальная звуковая сигнализация",
                    cry: "Махсус товушли ишора ёқилган бўлиши шарт"
                },
                isCorrect: false
            },
            {
                id: 32,
                text: {
                    uz: "Har ikkala yoqilgan bo'lishi shart",
                    ru: "Должны быть включены оба",
                    cry: "Ҳар иккала ёқилган бўлиши шарт"
                },
                isCorrect: true
            }
        ]
    }
    // Add more questions here following the same structure...
];