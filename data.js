// v21.12.4 dataset — full FLAVOR_DATA restored & key fixes
window.CATEGORY_META = [
  {"key":"best","angle":-1.570795,"color":"#2ecc71"},
  {"key":"good","angle":0,"color":"#f1c40f"},
  {"key":"bad","angle":3.14159,"color":"#e74c3c"},
  {"key":"unexpected","angle":1.570795,"color":"#00c2ff"}
];

window.TAXONOMY = {
  "categories": ["Фрукты","Овощи","Пряности","Сухие ингредиенты","Травы и зелень","Орехи и семена","Молочные","Крепкие алкогольные напитки"],
  "groups": {
    "Фрукты": ["Цитрусовые","Ягоды","Тропические","Косточковые","Яблоки/Груши","Дыни","Виноград"],
    "Овощи": ["Стеблевые","Крестоцветные","Луковые"],
    "Пряности": ["Корневища"],
    "Сухие ингредиенты": ["Какао/Шоколад","Злаки"],
    "Травы и зелень": ["Свежие травы"],
    "Орехи и семена": ["Орехи","Семена"],
    "Молочные": ["Базовые молочные","Сыры"],
    "Крепкие алкогольные напитки": ["Водка","Текила","Ром","Бренди/Коньяк","Джин"]
  },
  "subgroups": {
    "Цитрусовые": ["Лимоны","Лаймы","Апельсины","Грейпфрут","Мандарины"],
    "Ягоды": ["Клубника","Малина","Черника","Смородина чёрная"],
    "Тропические": ["Ананас","Манго","Маракуйя"],
    "Косточковые": ["Вишня","Черешня","Абрикос","Персик","Нектарин","Слива"],
    "Яблоки/Груши": ["Яблоки","Груши"],
    "Дыни": ["Канталупа","Медовая дыня","Арбуз"],
    "Виноград": ["Белый виноград","Красный виноград","Мускат"],

    "Стеблевые": ["Спаржа"],
    "Крестоцветные": ["Брокколи","Цветная капуста","Брюссельская капуста","Капуста белокочанная"],
    "Луковые": ["Лук репчатый","Чеснок","Зелёный лук"],

    "Корневища": ["Имбирь"],

    "Какао/Шоколад": ["Какао"],
    "Злаки": ["Рис","Овёс","Пшеница"],

    "Свежие травы": ["Мята","Базилик","Розмарин","Тимьян","Кинза","Шалфей"],

    "Орехи": ["Миндаль","Фундук","Грецкий орех","Арахис","Фисташка","Кешью"],
    "Семена": ["Кунжут","Тыквенные семечки","Подсолнечные семечки","Льняное семя"],

    "Базовые молочные": ["Сливки","Йогурт","Масло сливочное","Молоко"],
    "Сыры": ["Пармезан","Горгонзола","Бри","Фета"],

    "Водка": ["Чистая","Вкусовая","Ароматическая"],
    "Текила": [
      "100% агавы — Blanco / Plata",
      "100% агавы — Joven / Cristalino",
      "100% агавы — Reposado",
      "100% агавы — Añejo",
      "100% агавы — Extra Añejo",
      "Mixto — Blanco / Silver",
      "Mixto — Joven / Oro",
      "Mixto — Reposado",
      "Mixto — Añejo",
      "Mixto — Extra Añejo"
    ],
    "Ром": [
      "White / Blanco",
      "Gold / Amber",
      "Dark",
      "Aged (Añejo/Reserva)",
      "Spiced",
      "Overproof",
      "Rhum Agricole Blanc",
      "Rhum Agricole Vieux"
    ],
    "Бренди/Коньяк": [
      "Коньяк — VS",
      "Коньяк — VSOP",
      "Коньяк — XO",
      "Арманьяк — VS/VSOP",
      "Арманьяк — XO/Hors d’Age",
      "Испанский бренди — Reserva/Gran Reserva",
      "Писко — Puro/Acholado/Mosto Verde",
      "Кальвадос — Fine/VSOP/XO"
    ],
    "Джин": [
      "London Dry",
      "Old Tom",
      "Plymouth",
      "Navy Strength",
      "Современный стиль (New Western)",
      "Genever (Jenever)",
      "Бочковой (Barrel-Aged)"
    ]
  },
  "names": {
    "Лимоны": ["Eureka","Lisbon"],
    "Лаймы": ["Persian (Tahitian)","Key"],
    "Апельсины": ["Navel","Valencia","Blood"],
    "Грейпфрут": ["Ruby Red"],
    "Мандарины": ["Clementine"],

    "Клубника": ["Клубника садовая"],
    "Малина": ["Малина красная"],
    "Черника": ["Черника садовая"],
    "Смородина чёрная": ["Смородина чёрная (ягода)"],

    "Ананас": ["Ананас"],
    "Манго": ["Манго"],
    "Маракуйя": ["Маракуйя"],

    "Вишня": ["Вишня"],
    "Черешня": ["Черешня"],
    "Абрикос": ["Абрикос"],
    "Персик": ["Персик"],
    "Нектарин": ["Нектарин"],
    "Слива": ["Слива"],

    "Яблоки": ["Granny Smith","Fuji","Golden Delicious"],
    "Груши": ["Конференция","Боск"],

    "Канталупа": ["Канталупа"],
    "Медовая дыня": ["Медовая дыня"],
    "Арбуз": ["Арбуз"],

    "Белый виноград": ["Виноград белый"],
    "Красный виноград": ["Виноград красный"],
    "Мускат": ["Виноград мускатный"],

    "Спаржа": ["Спаржа зелёная"],

    "Брокколи": ["Брокколи"],
    "Цветная капуста": ["Цветная капуста"],
    "Брюссельская капуста": ["Брюссельская капуста"],
    "Капуста белокочанная": ["Капуста белокочанная"],

    "Лук репчатый": ["Лук репчатый"],
    "Чеснок": ["Чеснок"],
    "Зелёный лук": ["Зелёный лук"],

    "Имбирь": ["Имбирь свежий"],

    "Какао": ["Какао порошок"],
    "Рис": ["Рис"],
    "Овёс": ["Овёс"],
    "Пшеница": ["Пшеница"],

    "Мята": ["Мята"],
    "Базилик": ["Базилик"],
    "Розмарин": ["Розмарин"],
    "Тимьян": ["Тимьян"],
    "Кинза": ["Кинза"],
    "Шалфей": ["Шалфей"],

    "Миндаль": ["Миндаль"],
    "Фундук": ["Фундук"],
    "Грецкий орех": ["Грецкий орех"],
    "Арахис": ["Арахис"],
    "Фисташка": ["Фисташка"],
    "Кешью": ["Кешью"],
    "Кунжут": ["Кунжут"],
    "Тыквенные семечки": ["Тыквенные семечки"],
    "Подсолнечные семечки": ["Подсолнечные семечки"],
    "Льняное семя": ["Льняное семя"],

    "Сливки": ["Сливки"],
    "Йогурт": ["Йогурт"],
    "Масло сливочное": ["Масло сливочное"],
    "Молоко": ["Молоко"],
    "Пармезан": ["Пармезан"],
    "Горгонзола": ["Горгонзола"],
    "Бри": ["Бри"],
    "Фета": ["Фета"],

    "Чистая": ["Русский Стандарт Original (40%)","Пять Озёр Классическая","Beluga Noble (40%)"],
    "Вкусовая": ["Absolut Citron","Absolut Raspberry","Finlandia Lime","Finlandia Cranberry"],
    "Ароматическая": ["Пять Озёр Перцовая","Зелёная Марка Перцовая","Тундра Перцовая"],

    "100% агавы — Blanco / Plata": ["Olmeca Altos Plata","Espolòn Blanco","Don Julio Blanco","Patrón Silver","1800 Plata"],
    "100% агавы — Joven / Cristalino": ["Maestro Dobel Diamante (Cristalino)","Jose Cuervo Tradicional Reposado Cristalino","1800 Cristalino","Cazadores Joven Cristalino","Volcán De Mi Tierra Cristalino"],
    "100% агавы — Reposado": ["Espolòn Reposado","Olmeca Altos Reposado","Herradura Reposado","Don Julio Reposado","1800 Reposado"],
    "100% агавы — Añejo": ["1800 Añejo","Don Julio Añejo","Herradura Añejo","Patrón Añejo","Cazadores Añejo"],
    "100% агавы — Extra Añejo": ["Patrón Extra Añejo","Herradura Selección Suprema","1800 Milenio","Don Julio 1942","Gran Patrón Burdeos"],

    "Mixto — Blanco / Silver": ["Olmeca Blanco","Sierra Silver","Jose Cuervo Especial Silver","Sauza Silver","El Jimador Blanco"],
    "Mixto — Joven / Oro": ["Jose Cuervo Especial Gold","Sierra Gold","Sauza Gold","Olmeca Gold","El Jimador Gold"],
    "Mixto — Reposado": ["Olmeca Reposado","Sierra Reposado","Jose Cuervo Especial Reposado","Sauza Reposado","El Jimador Reposado"],
    "Mixto — Añejo": ["Sauza Añejo","Jose Cuervo Аñejo","Sierra Añejo","El Jimador Añejo","Olmeca (лимитированные)"],
    "Mixto — Extra Añejo": [],

    "White / Blanco": ["Bacardi Carta Blanca","Havana Club 3 Años","Plantation 3 Stars"],
    "Gold / Amber": ["Appleton Signature","Havana Club Añejo Especial","Mount Gay Eclipse"],
    "Dark": ["Myers’s Dark","Goslings Black Seal"],
    "Aged (Añejo/Reserva)": ["Diplomático Reserva Exclusiva","Ron Zacapa 23","El Dorado 12"],
    "Spiced": ["Captain Morgan Spiced","Sailor Jerry Spiced"],
    "Overproof": ["Wray & Nephew Overproof","Plantation OFTD"],
    "Rhum Agricole Blanc": ["Clément Blanc","Rhum J.M Blanc"],
    "Rhum Agricole Vieux": ["Clément VSOP","Rhum J.M Vieux"],

    "Коньяк — VS": ["Hennessy VS","Rémy Martin VS","Courvoisier VS"],
    "Коньяк — VSOP": ["Hennessy VSOP","Rémy Martin VSOP","Martell VSOP"],
    "Коньяк — XO": ["Hennessy XO","Rémy Martin XO","Martell XO"],
    "Арманьяк — VS/VSOP": ["Delord VSOP","Janneau VSOP"],
    "Арманьяк — XO/Hors d’Age": ["Delord XO","Château de Laubade XO"],
    "Испанский бренди — Reserva/Gran Reserva": ["Torres 10","Torres 15","Cardenal Mendoza"],
    "Писко — Puro/Acholado/Mosto Verde": ["Barsol Puro Quebranta","Barsol Mosto Verde Italia"],
    "Кальвадос — Fine/VSOP/XO": ["Boulard Grand Solage","Père Magloire VSOP","Dupont VSOP"],

    "London Dry": ["Tanqueray London Dry","Beefeater London Dry","Gordon's London Dry","Bombay Sapphire"],
    "Old Tom": ["Hayman’s Old Tom","Ransom Old Tom"],
    "Plymouth": ["Plymouth Gin"],
    "Navy Strength": ["Plymouth Navy Strength","Hayman’s Royal Dock","Four Pillars Navy Strength"],
    "Современный стиль (New Western)": ["Hendrick’s","Monkey 47","The Botanist","Roku","Aviation"],
    "Genever (Jenever)": ["Bols Genever","Rutte Old Simon"],
    "Бочковой (Barrel-Aged)": ["Citadelle Réserve","Beefeater Burrough’s Reserve","Four Pillars Barrel Aged"]
  }
};

window.FLAVOR_DATA = {
  "Цитрусовые": {
    "notes": "Лимонен/цитраль. Любят зелень, крестоцветные, белую рыбу.",
    "best": [
      {"to":"Кинза","tip":"Терпены дружат с зеленью"},
      {"to":"Имбирь","tip":"Цитраль + гингерол"},
      {"to":"Белая рыба","tip":"Кислота чистит жирность"}
    ],
    "good": [{"to":"Авокадо","tip":"Кремовость + кислота"},{"to":"Йогурт","tip":"Соусы/десерты"}],
    "bad": [
      {"to":"Сильный дым","tip":"Фенолы забивают цитрус"},
      {"to":"Молоко/Сливки без стабилизации","tip":"Сворачивание"},
      {"to":"Горький хмель","tip":"Биттерность конфликтует"}
    ],
    "unexpected": [{"to":"Тмин","tip":"Пряный сдвиг"}]
  }
};