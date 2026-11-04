// Падежи: [падеж, вопрос, русский аналог, когда]
const CASE_INFO=[
['Nominativ','ko? šta?','Именительный','подлежащее: Marko čita.'],
['Genitiv','koga? čega?','Родительный','nemam, bez, od, iz, do, pored, kod, posle'],
['Dativ','kome? čemu?','Дательный','dajem, pomažem, hvala, sviđa mi se, treba mi'],
['Akuzativ','koga? šta?','Винительный','vidim, volim, čekam; u/na + куда?'],
['Vokativ','(obraćanje)','—  (нет в русском)','обращение: Marko! Ivane! Majko!'],
['Instrumental','kim? čim?','Творительный','sa, s + кем; путь/средство: autobusom'],
['Lokativ','o kome? o čemu?','Предложный','u, na + где?; o, po, pri'],
];
// Окончания ед.ч.: [падеж, м.р. (grad), ж.р. (žena), ср.р. (selo)]
const ENDINGS_SG=[
['Nom','–','-a','-o / -e'],
['Gen','-a','-e','-a'],
['Dat','-u','-i','-u'],
['Akk','-a (одуш.) / – (неодуш.)','-u','-o / -e'],
['Vok','-e / -u','-o / -a','-o / -e'],
['Ins','-om / -em','-om','-om / -em'],
['Lok','-u','-i','-u'],
];
const ENDINGS_PL=[
['Nom','-i','-e','-a'],
['Gen','-a','-a','-a'],
['Dat','-ima','-ama','-ima'],
['Akk','-e','-e','-a'],
['Ins','-ima','-ama','-ima'],
['Lok','-ima','-ama','-ima'],
];
// Местоимения: [лицо, Nom, Gen, Dat, Akk, Ins, Lok] (форма / клитик)
const PRON=[
['ja','ja','mene / me','meni / mi','mene / me','mnom','(o) meni'],
['ti','ti','tebe / te','tebi / ti','tebe / te','tobom','(o) tebi'],
['on','on','njega / ga','njemu / mu','njega / ga','njim','(o) njemu'],
['ona','ona','nje / je','njoj / joj','nju / je','njom','(o) njoj'],
['ono','ono','njega / ga','njemu / mu','njega / ga','njim','(o) njemu'],
['mi','mi','nas','nama / nam','nas','nama','(o) nama'],
['vi','vi','vas','vama / vam','vas','vama','(o) vama'],
['oni','oni','njih / ih','njima / im','njih / ih','njima','(o) njima'],
];
// Ловушки русского языка
const TRAPS=[
['Ekavica, не «ее/ие»','молоко → mleko, время → vreme, ребёнок → dete, река → reka. Никаких «mlijeko» — это иекавица (Босния, Хорватия, Черногория).'],
['Нет инфинитива после модальных','Хочу писать → Hoću da pišem. Могу прийти → Mogu da dođem. Конструкция da + настоящее время.'],
['«У меня есть» = Imam','Не «kod mene je». Нет → Nemam. Было → Imao sam.'],
['Род. падеж мн. ч.: -a','pet knjiga, deset ljudi, mnogo stvari. Русское «книг» без окончания — частая ошибка.'],
['Женский род в творительном: -om','sa ženom, sa majkom, sa knjigom. Не «-ой».'],
['Звательный падеж','Marko → Marko! / Ivan → Ivane! / majka → majko! / prijatelj → prijatelju!'],
['Одушевлённость','Čekam brata (как в русском), но Čekam autobus. Винительный совпадает с родительным только у одушевлённых м.р.'],
['Клитики на втором месте','Ja ti ga dajem. Sviđa mi se. Ne vidim ga. Короткие формы (mi, ti, ga, je, se) стоят после первого ударного слова.'],
['Время: «posle» и «pre»','pre sat vremena = час назад; posle posla = после работы; za deset minuta = через десять минут.'],
['Ложные друзья','sutra = завтра, jutro = утро; sat = час, čas = урок; pitati = спрашивать; zato = поэтому; lep = красивый; uvek = всегда.'],
];
// Произношение
const SOUNDS=[
['č / ć','č — твёрдое, «ч» с оттенком «ш»; ć — мягкое, ближе к русскому «ч». Сравните: čaša (стакан) и ćutati (молчать).'],
['dž / đ','dž — твёрдое «дж» (džem); đ — мягкое «дь» (đak, Đorđe).'],
['lj, nj','Одна мягкая согласная: lj = «ль» (ljubav), nj = «нь» (njiva). Не «л-й».'],
['h','Всегда «х», даже в начале слова и между гласными: hleb, kuhinja.'],
['Слоговое r','Бывает гласным: prst, vrt, Srbija, trg. Произносится как короткое раскатистое «р» без гласной.'],
['Безударные гласные','В отличие от русского, гласные не редуцируются: «a» — всегда [а], «o» — всегда [о]. Не «аканье».'],
['Ударение','Не бывает на последнем слоге: pro-DAV-ni-ca, не *prodavnI-ca. Четыре типа тона, но на старте важнее не сдвигать ударение к концу.'],
];
