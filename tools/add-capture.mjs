/* Wire site/capture.js into the site. Node, never the shell: these files hold
   Greek and Russian, and PowerShell's Set-Content corrupts both. Idempotent. */
import { readFileSync, writeFileSync } from "node:fs";
const R = (p) => readFileSync(p, "utf8");
const W = (p, s) => writeFileSync(p, s, "utf8");
const log = [];

/* ---------- 1. styles ---------------------------------------------------- */
let css = R("site/evzo.css");
if (!css.includes(".capture{")) {
  css += `

/* ---------- email capture (site/capture.js) ----------
   A modal, not a bar: it appears at the moment the visitor has just seen their
   own numbers, and a thin strip at the bottom of the screen would be competing
   with the cookie bar for the same few pixels. Escape, the cross, and a click
   on the backdrop all close it. */
.capture{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;
  padding:18px;background:rgba(6,10,20,.72);opacity:0;transition:opacity .2s ease}
.capture.on{opacity:1}
.capture-card{position:relative;width:100%;max-width:480px;background:var(--raised);
  border:1px solid var(--line-soft);border-top:3px solid var(--yellow);padding:34px 30px 26px;
  transform:translateY(10px);transition:transform .2s ease}
.capture.on .capture-card{transform:none}
.capture-card h2{margin-top:6px;font-size:clamp(24px,5vw,32px)}
.capture-card .lede{margin-top:12px}
.capture-x{position:absolute;top:8px;right:10px;width:40px;height:40px;background:none;border:0;
  color:var(--bone-dim);font-size:30px;line-height:1;cursor:pointer}
.capture-x:hover{color:var(--bone)}
.capture-form{display:flex;flex-direction:column;gap:12px;margin-top:20px}
.capture-form input{width:100%;padding:15px 16px;font:inherit;font-size:16px;color:var(--bone);
  background:var(--ground);border:1px solid var(--line-soft)}
.capture-form input:focus{outline:2px solid var(--yellow);outline-offset:1px}
.capture-tick{text-align:left}
.capture-tick .t{font-size:14px;line-height:1.45}
.capture-said{margin:0;font-size:14px;color:#E38B7A}
.capture-ok{margin:0;font-size:17px;line-height:1.5;color:var(--bone)}
.capture-card .note{margin-top:14px;text-align:center}
@media (prefers-reduced-motion:reduce){.capture,.capture-card{transition:none}}
`;
  W("site/evzo.css", css); log.push("styles");
}

/* ---------- 2. the relay key, empty until Marco gets one ------------------ */
let cfg = R("site/config.js");
if (!cfg.includes("web3formsKey")) {
  cfg = cfg.replace(/(\n(\s*)analyticsEnabled:[^\n]*\n)/, (m, line, ind) => line +
`${ind}// Email capture relay (site/capture.js). Free at web3forms.com: enter the
${ind}// support address, a key arrives by email, paste it here. Until then the
${ind}// popup falls back to opening the visitor's mail app, so nothing is lost.
${ind}web3formsKey: "TODO_OWNER",
`);
  W("site/config.js", cfg); log.push("config key");
}

/* ---------- 3. the words, in Greek and Russian ---------------------------- */
const STR = {
  "Close": ["Κλείσιμο", "Закрыть"],
  "Free": ["Δωρεάν", "Бесплатно"],
  "Want the first three days written out?": ["Θες τις πρώτες τρεις μέρες γραμμένες;", "Хотите первые три дня расписанными?"],
  "Before you go, a free three-day plan": ["Πριν φύγεις, ένα δωρεάν πλάνο τριών ημερών", "Перед уходом: бесплатный план на три дня"],
  "Three days of meals built on the numbers you just saw, with the shopping list. Sent to your inbox within 24 hours.":
    ["Τρεις μέρες γεύματα πάνω στους αριθμούς που μόλις είδες, μαζί με τη λίστα για το σούπερ μάρκετ. Στο email σου μέσα σε 24 ώρες.",
     "Три дня питания по цифрам, которые вы только что увидели, со списком покупок. На вашу почту в течение 24 часов."],
  "Three days of Mediterranean meals with the portions worked out, and the shopping list. Sent to your inbox within 24 hours.":
    ["Τρεις μέρες μεσογειακά γεύματα με τις μερίδες υπολογισμένες, και η λίστα για το σούπερ μάρκετ. Στο email σου μέσα σε 24 ώρες.",
     "Три дня средиземноморского питания с рассчитанными порциями и списком покупок. На вашу почту в течение 24 часов."],
  "Email address": ["Διεύθυνση email", "Адрес почты"],
  "Send me the plan, and occasional emails from EVZO. I can unsubscribe in one click.":
    ["Στείλτε μου το πλάνο και περιστασιακά email από την EVZO. Μπορώ να διαγραφώ με ένα κλικ.",
     "Пришлите мне план и иногда письма от EVZO. Отписаться можно в один клик."],
  "Send me the plan": ["Στείλτε μου το πλάνο", "Прислать план"],
  "No spam. Your health answers are never sent.": ["Χωρίς spam. Οι απαντήσεις σου για την υγεία δεν στέλνονται ποτέ.", "Без спама. Ваши ответы о здоровье не передаются никогда."],
  "That does not look like an email address.": ["Αυτό δεν μοιάζει με διεύθυνση email.", "Это не похоже на адрес почты."],
  "Tick the box so we are allowed to email you.": ["Τσέκαρε το κουτάκι για να μπορούμε να σου στείλουμε email.", "Отметьте пункт, чтобы мы могли вам написать."],
  "Done. Check your inbox within 24 hours, and the spam folder if it is not there.":
    ["Έγινε. Κοίτα τα εισερχόμενά σου μέσα σε 24 ώρες, και τα ανεπιθύμητα αν δεν είναι εκεί.",
     "Готово. Проверьте почту в течение 24 часов, и папку «Спам», если письма нет."],
  "That did not go through. Try again, or email evzo.method@outlook.com.":
    ["Δεν στάλθηκε. Δοκίμασε ξανά, ή γράψε στο evzo.method@outlook.com.",
     "Не отправилось. Попробуйте ещё раз или напишите на evzo.method@outlook.com."],
};

let el = R("site/i18n.js");
let addedEl = 0;
const elLines = [];
for (const [en, [gr]] of Object.entries(STR)) {
  if (el.includes(JSON.stringify(en) + ":")) continue;
  elLines.push(`    ${JSON.stringify(en)}: ${JSON.stringify(gr)},`);
  addedEl++;
}
if (elLines.length) {
  el = el.replace(/(\r?\n\s{4}"Digital delivery": "[^"]*",)/, `$1\n    /* email capture */\n${elLines.join("\n")}`);
  W("site/i18n.js", el); log.push(`${addedEl} greek strings`);
}

let ru = R("site/i18n-ru.js");
const ruLines = [];
for (const [en, [, rus]] of Object.entries(STR)) {
  if (ru.includes(JSON.stringify(en) + ":")) continue;
  ruLines.push(`    ${JSON.stringify(en)}: ${JSON.stringify(rus)},`);
}
if (ruLines.length) {
  ru = ru.replace(/(\r?\n\s{4}\/\* footer \*\/)/, `\n    /* email capture */\n${ruLines.join("\n")}$1`);
  W("site/i18n-ru.js", ru); log.push(`${ruLines.length} russian strings`);
}

/* ---------- 4. load it on the pages people buy from ----------------------- */
for (const p of ["index.html", "shop/index.html"]) {
  let h = R(p);
  if (h.includes("capture.js")) continue;
  h = h.replace(/<script src="([^"]*?)pixel\.js"><\/script>/, (m, pre) => `${m}\n<script src="${pre}capture.js"></script>`);
  W(p, h); log.push(p);
}

/* ---------- 5. say so in the privacy policy -------------------------------- */
let legal = R("legal/index.html");
if (!legal.includes("Web3Forms")) {
  legal = legal.replace(/(<details id="cookies">)/, `<details id="email-list">
        <summary>Email list</summary>
        <div class="a">
          <p><strong>Only if you ask.</strong> The free three-day plan is sent by email, and
          the address is collected only with a box you tick yourself, never pre-ticked.
          It is relayed to our inbox by Web3Forms, a form-delivery service, because this
          site has no server of its own to keep it on.</p>

          <p><strong>What is sent with it.</strong> Your address, your language, and, if
          you finished the questions, your goal and the calorie and protein ranges the
          plan is written from. Never your weight, height or age, and never any of the
          health questions. Unsubscribe from any email in one click, or write to us and
          the address is deleted.</p>
        </div>
      </details>

      $1`);
  W("legal/index.html", legal); log.push("privacy policy");
}

console.log("done:", log.join(", ") || "nothing to do");
