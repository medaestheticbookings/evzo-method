/* Greek and Russian for /thank-you/. Node, never the shell. Idempotent. */
import { readFileSync, writeFileSync } from "node:fs";

const STR = {
  "Payment received": ["Η πληρωμή ολοκληρώθηκε", "Оплата получена"],
  "Thank you. It is on its way.": ["Ευχαριστούμε. Είναι καθ' οδόν.", "Спасибо. Уже в пути."],
  "Your PDF is being emailed to the address you paid with. It usually arrives within 15 minutes, from books@evzomethod.com.":
    ["Το PDF σου στέλνεται στο email με το οποίο πλήρωσες. Συνήθως φτάνει μέσα σε 15 λεπτά, από το books@evzomethod.com.",
     "Ваш PDF отправляется на почту, с которой вы оплатили. Обычно приходит в течение 15 минут, от books@evzomethod.com."],
  "Your guide is written by hand from your answers and emailed to the address you paid with within 24 hours.":
    ["Ο οδηγός σου γράφεται με το χέρι από τις απαντήσεις σου και στέλνεται στο email με το οποίο πλήρωσες μέσα σε 24 ώρες.",
     "Ваш план составляется вручную по вашим ответам и отправляется на почту, с которой вы оплатили, в течение 24 часов."],
  "Order": ["Παραγγελία", "Заказ"],
  "confirmed": ["επιβεβαιώθηκε", "подтверждён"],
  "Delivery": ["Παράδοση", "Доставка"],
  "by email": ["με email", "по почте"],
  "Nothing arrived after fifteen minutes? Check the spam folder first, then email evzo.method@outlook.com and it will be resent. Attachments sometimes land there on the first message from a new sender.":
    ["Δεν ήρθε τίποτα μετά από δεκαπέντε λεπτά; Κοίτα πρώτα τα ανεπιθύμητα, μετά γράψε στο evzo.method@outlook.com και θα σου ξανασταλεί. Τα συνημμένα καμιά φορά καταλήγουν εκεί στο πρώτο μήνυμα από νέο αποστολέα.",
     "Ничего не пришло через пятнадцать минут? Сначала проверьте «Спам», затем напишите на evzo.method@outlook.com, и мы отправим снова. Вложения иногда попадают туда в первом письме от нового отправителя."],
  "Back to the shop": ["Πίσω στο κατάστημα", "Вернуться в магазин"],
  "Read the blog": ["Διάβασε το blog", "Читать блог"],
};

function add(file, idx, anchorRe, header) {
  let t = readFileSync(file, "utf8");
  const lines = [];
  for (const [en, tr] of Object.entries(STR)) {
    if (t.includes(JSON.stringify(en) + ":")) continue;
    lines.push(`    ${JSON.stringify(en)}: ${JSON.stringify(tr[idx])},`);
  }
  if (!lines.length) return 0;
  const before = t;
  t = t.replace(anchorRe, (m) => `${m}\n    /* thank-you page */\n${lines.join("\n")}`);
  if (t === before) throw new Error("anchor not found in " + file);
  writeFileSync(file, t, "utf8");
  return lines.length;
}

const el = add("site/i18n.js", 0, /\r?\n\s{4}"Digital delivery": "[^"]*",/);
const ru = add("site/i18n-ru.js", 1, /\r?\n\s{4}"No subscription": "[^"]*",/);
console.log(`thank-you strings: ${el} greek, ${ru} russian`);

// The page needs the Russian dictionary loaded and the switch-free default.
let h = readFileSync("thank-you/index.html", "utf8");
if (!h.includes("i18n-ru.js")) {
  h = h.replace(/<script src="([^"]*?)i18n\.js"><\/script>/, (m, pre) => `${m}\n<script src="${pre}i18n-ru.js"></script>`);
  writeFileSync("thank-you/index.html", h, "utf8");
  console.log("thank-you page now loads i18n-ru.js");
}
