/* EVZO, Russian
 * ============================================================================
 * Kept in its own file rather than bolted onto i18n.js, which is already 900
 * lines of Greek. Same shape: keyed by the English string, so markup stays
 * clean, and anything missing falls through to English rather than vanishing.
 *
 * Cyprus has a large Russian-speaking population, which is the whole reason
 * this exists. The copy is written for them, not translated word for word:
 * "Δεν φταις εσύ" is an argument, not a phrase, and it has to stay an argument.
 *
 * Anton has no Cyrillic, so Russian headlines fall back to Commissioner 800
 * through body.ru, exactly as Greek already does. See site/evzo.css.
 * ========================================================================= */
(function (root) {
  "use strict";

  root.EVZO_RU = {
    /* nav and header */
    "How it works": "Как это работает",
    "What you get": "Что вы получаете",
    "Price": "Цена",
    "Shop": "Магазин",
    "Blog": "Блог",
    "FAQ": "Вопросы",
    "Home": "Главная",
    "The guide": "Руководство",
    "Build my guide": "Составить мой план",
    "Skip to the assessment": "Перейти к анкете",

    /* hero */
    "Personalised monthly meal guide": "Персональный план питания на месяц",
    "Your goal. Your food.": "Ваша цель. Ваша еда.",
    "A plan built around your real life.": "План под вашу настоящую жизнь.",
    "Answer a few short questions. Get a month of meals built from your own numbers, and from Mediterranean food you will actually want to eat.":
      "Ответьте на несколько коротких вопросов. Получите месяц питания, рассчитанный по вашим цифрам, из средиземноморской еды, которую вы действительно захотите есть.",
    "See what is inside": "Посмотреть, что внутри",
    "Takes about three minutes. Nothing to pay to see your numbers.":
      "Около трёх минут. Чтобы увидеть свои цифры, платить не нужно.",
    "Digital delivery": "Цифровая доставка",
    "Built from your answers": "Составлено по вашим ответам",
    "No subscription": "Без подписки",
    "One plate, not a banquet. The portions are the part built for you.":
      "Одна тарелка, а не застолье. Порции — это и есть то, что рассчитано под вас.",

    /* the goal cards */
    "Step one": "Шаг первый",
    "Pick the one you actually want": "Выберите то, что вам действительно нужно",
    "Everything after this is shaped by this answer.": "Всё дальнейшее зависит от этого ответа.",
    "Lose fat": "Снизить вес",
    "Maintain weight": "Удержать вес",
    "Gain weight": "Набрать вес",
    "Eat less than you burn, at a pace you can hold, with enough protein to keep you full.":
      "Есть меньше, чем тратите, в темпе, который реально выдержать, с белком, которого хватает, чтобы не голодать.",
    "Keep where you are and build structure into how you eat, without counting forever.":
      "Остаться на своём весе и навести порядок в питании, не считая калории всю жизнь.",
    "Eat above maintenance at a controlled rate, with protein and training in mind.":
      "Есть выше нормы в контролируемом темпе, с учётом белка и тренировок.",
    "Select": "Выбрать",

    /* the questions */
    "Now the questions": "Теперь вопросы",
    "Question": "Вопрос",
    "of": "из",
    "Continue": "Далее",
    "Back": "Назад",
    "Start again": "Начать заново",
    "See my snapshot": "Показать мои цифры",
    "How old are you?": "Сколько вам лет?",
    "Age, years": "Возраст, лет",
    "I confirm I am 18 or over": "Подтверждаю, что мне 18 или больше",
    "Which units do you think in?": "В каких единицах вам привычно?",
    "How tall are you?": "Какой у вас рост?",
    "What do you weigh right now?": "Сколько вы весите сейчас?",
    "Today's number, not a target. The estimate is built from where you are.":
      "Сегодняшняя цифра, не цель. Расчёт строится от того, где вы сейчас.",

    /* pace */
    "How fast do you want to lose it?": "Как быстро хотите снижать вес?",
    "How fast do you want to gain?": "Как быстро хотите набирать?",
    "Slower is not worse. The quicker you go the more of the loss comes from muscle, and the harder the week is to hold to.":
      "Медленнее не значит хуже. Чем быстрее темп, тем большая часть потери приходится на мышцы и тем тяжелее выдержать неделю.",
    "Steady": "Спокойно",
    "Standard": "Обычно",
    "Faster": "Быстрее",
    "Aggressive": "Агрессивно",
    "Lean": "Аккуратно",
    "recommended": "рекомендуем",
    "not recommended": "не рекомендуем",
    "kg a week": "кг в неделю",
    "lb a week": "фунтов в неделю",
    "asked for": "запрошено",
    "At this rate more of what you lose is muscle, hunger makes the week hard to hold, and most people give it back.":
      "При таком темпе большая часть потери — мышцы, голод делает неделю невыносимой, и почти все возвращают вес обратно.",

    /* the result */
    "Your goal snapshot": "Ваши цифры",
    "Your goal": "Ваша цель",
    "Your chosen pace": "Выбранный темп",
    "Maintenance estimate": "Норма поддержания",
    "Suggested protein range": "Рекомендуемый белок",
    "Height-to-weight ratio": "Соотношение роста и веса",
    "Your chosen split": "Выбранное распределение",
    "Foods you picked": "Выбранные продукты",
    "goal_lose": "снижение веса",
    "goal_maintain": "поддержание",
    "goal_gain": "набор веса",
    "result_lede": "Это образовательные оценки, а не медицинские предписания. Считайте их отправной точкой и корректируйте по тому, что видите на практике.",
    "result_note": "Цифры даны диапазоном, потому что ни одна формула не знает ваше тело точно. Начните с середины, держитесь две недели, затем скорректируйте. При медицинских или особых диетических потребностях это может вам не подойти.",
    "clamped_note": "Запрошенный темп увёл бы вас слишком низко, поэтому расчёт удержан на безопасном уровне.",

    /* pricing and checkout */
    "Pick how long you want it for": "Выберите, на какой срок",
    "28 days": "28 дней",
    "3 months": "3 месяца",
    "6 months": "6 месяцев",
    "One month, built from your answers.": "Один месяц, составленный по вашим ответам.",
    "Recommended": "Рекомендуем",
    "Get My Personalised Guide": "Получить персональный план",
    "consent_required": "Отметьте оба пункта, чтобы перейти к оплате.",
    "assessment_required": "Сначала составьте план. Вопросы о здоровье определяют, подходит ли это вам.",
    "excluded_blocked": "Оплата закрыта из-за ваших ответов о здоровье. Пожалуйста, обратитесь к дипломированному диетологу или врачу.",
    "checkout_unavailable": "Оплата на этой странице пока не подключена.",

    /* safety and scope */
    "General wellness guidance, not medical or dietetic care.":
      "Общие рекомендации по здоровому образу жизни, не медицинская и не диетологическая помощь.",
    "We are not dietitians or healthcare professionals. Everything here is an educational estimate.":
      "Мы не диетологи и не медицинские работники. Всё здесь — образовательные расчёты.",
    "excl_pregnantOrBreastfeeding": "Беременность или грудное вскармливание",
    "excl_eatingDisorder": "Расстройство пищевого поведения сейчас или в прошлом",
    "excl_diabetesOrMetabolic": "Диабет или диагностированное нарушение обмена веществ",
    "excl_organCondition": "Заболевание почек, печени или серьёзное заболевание ЖКТ",
    "excl_severeAllergy": "Тяжёлая пищевая аллергия",
    "excl_prescribedDiet": "Диета, назначенная врачом",
    "excl_medicationAffectingWeight": "Препараты, влияющие на аппетит, сахар или вес",

    /* consent banner */
    "Cookies for advertising only if you allow it. Your health answers are never sent, whatever you choose.":
      "Файлы cookie для рекламы — только с вашего разрешения. Ваши ответы о здоровье не передаются никогда, что бы вы ни выбрали.",
    "Choose": "Настроить",
    "Reject": "Отклонить",
    "OK": "Принять",
    "Cookie settings": "Настройки cookie",
    "Details": "Подробнее",

    /* footer */
    "ευ ζω, to live well": "ευ ζω, жить хорошо",
    "Terms and conditions": "Условия",
    "Privacy policy": "Конфиденциальность",
    "Cookie policy": "Cookie",
    "Refund and digital delivery": "Возврат и доставка",
    "Contact": "Контакты",
    "Questions": "Вопросы",
    "Before you ask": "Прежде чем спросите"
  };
})(window);
