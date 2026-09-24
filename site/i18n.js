/* EVZO — language
 * ============================================================================
 * Keyed by the English string itself, so markup stays clean: on switch the page
 * walks its own text nodes and swaps what it recognises. Anything missing stays
 * in English rather than vanishing, so a gap is visible, never silent.
 * ========================================================================== */

(function () {
  "use strict";

  var EL = {
    /* header + hero */
    "How it works": "Πώς λειτουργεί",
    "What you get": "Τι παίρνεις",
    "Price": "Τιμή",
    "FAQ": "Συχνές ερωτήσεις",
    "Build my guide": "Φτιάξε τον οδηγό μου",
    "Skip to the assessment": "Μετάβαση στο ερωτηματολόγιο",
    "Personalised monthly meal guide": "Εξατομικευμένος μηνιαίος οδηγός γευμάτων",
    "Your goal. Your food. A plan built around your real life.":
      "Ο στόχος σου. Το φαγητό σου. Ένα πλάνο φτιαγμένο για την πραγματική σου ζωή.",
    "Choose your goal, tell us how you eat, and receive a practical monthly meal guide matched to your preferences, schedule and routine.":
      "Διάλεξε τον στόχο σου, πες μας πώς τρως, και πάρε έναν πρακτικό μηνιαίο οδηγό γευμάτων ταιριασμένο στις προτιμήσεις, το πρόγραμμα και τη ρουτίνα σου.",
    "See what is inside": "Δες τι περιέχει",
    "Digital delivery": "Ψηφιακή παράδοση",
    "Made around your answers": "Φτιαγμένο από τις απαντήσεις σου",
    "No subscription": "Χωρίς συνδρομή",
    "General wellness guidance — not medical or dietetic care.":
      "Γενική καθοδήγηση ευεξίας — όχι ιατρική ή διαιτολογική φροντίδα.",
    "We are not dietitians or healthcare professionals. Everything here is an educational estimate.":
      "Δεν είμαστε διαιτολόγοι ούτε επαγγελματίες υγείας. Όλα εδώ είναι εκπαιδευτικές εκτιμήσεις.",

    /* goals */
    "Step one": "Βήμα ένα",
    "Pick the one you actually want": "Διάλεξε αυτό που θέλεις πραγματικά",
    "Everything after this is shaped by this answer — the calorie range, the protein target and the way the week is built.":
      "Όλα από εδώ και πέρα διαμορφώνονται από αυτή την απάντηση — το εύρος θερμίδων, ο στόχος πρωτεΐνης και ο τρόπος που χτίζεται η εβδομάδα.",
    "Lose fat": "Χάσιμο λίπους",
    "Maintain weight": "Διατήρηση βάρους",
    "Gain weight": "Αύξηση βάρους",
    "Eat less than you burn, at a pace you can hold, with enough protein to keep you full.":
      "Τρώς λιγότερο από όσο καις, με ρυθμό που αντέχεις, με αρκετή πρωτεΐνη για να χορταίνεις.",
    "Keep where you are and build structure into how you eat, without counting forever.":
      "Μένεις εκεί που είσαι και βάζεις δομή στο πώς τρως, χωρίς να μετράς για πάντα.",
    "Eat above maintenance at a controlled rate, with protein and training in mind.":
      "Τρώς πάνω από τη συντήρηση με ελεγχόμενο ρυθμό, με γνώμονα την πρωτεΐνη και την προπόνηση.",
    "Select": "Επιλογή",

    /* assessment */
    "Step two": "Βήμα δύο",
    "Your goal snapshot": "Η εικόνα του στόχου σου",
    "Eight short questions. Nothing is stored anywhere and nothing is sent to advertising tools.":
      "Οκτώ σύντομες ερωτήσεις. Τίποτα δεν αποθηκεύεται πουθενά και τίποτα δεν στέλνεται σε διαφημιστικά εργαλεία.",
    "Start again": "Ξεκίνα ξανά",
    "Question": "Ερώτηση",
    "of": "από",
    "Continue": "Συνέχεια",
    "Back": "Πίσω",
    "See my snapshot": "Δες την εικόνα μου",
    "What is the goal?": "Ποιος είναι ο στόχος;",
    "You can change this at any point without losing your other answers.":
      "Μπορείς να το αλλάξεις όποτε θες χωρίς να χάσεις τις άλλες απαντήσεις.",
    "A controlled deficit you can actually hold": "Ελεγχόμενο έλλειμμα που αντέχεις στ' αλήθεια",
    "Structure without changing the scale": "Δομή χωρίς να αλλάξει η ζυγαριά",
    "A measured surplus, not a free-for-all": "Μετρημένο πλεόνασμα, όχι ελεύθερο φαγητό",
    "How old are you?": "Πόσων χρονών είσαι;",
    "Age changes how many calories your body uses at rest, so the estimate needs it. This guide is for adults only.":
      "Η ηλικία αλλάζει πόσες θερμίδες καίει το σώμα σου σε ηρεμία, οπότε η εκτίμηση τη χρειάζεται. Ο οδηγός είναι μόνο για ενήλικες.",
    "Age — years": "Ηλικία — έτη",
    "I confirm I am 18 or over": "Επιβεβαιώνω ότι είμαι 18 ή άνω",
    "Which units do you think in?": "Σε ποιες μονάδες σκέφτεσαι;",
    "Switching later converts what you have already typed — you will not have to redo anything.":
      "Αν αλλάξεις αργότερα, μετατρέπονται όσα έγραψες — δεν θα ξαναγράψεις τίποτα.",
    "kg & cm\": \"κιλά & εκ.\", \"lb & ft\": \"λίβρες & πόδια\", \"st & ft": "stone & πόδια",
    "How tall are you?": "Πόσο ψηλός/ή είσαι;",
    "Used only inside the calorie estimate.": "Χρησιμοποιείται μόνο μέσα στην εκτίμηση θερμίδων.",
    "What do you weigh right now?": "Πόσο ζυγίζεις αυτή τη στιγμή;",
    "Today's number, not a target. The estimate is built from where you are.":
      "Το σημερινό νούμερο, όχι στόχος. Η εκτίμηση χτίζεται από εκεί που είσαι.",
    "Which resting-rate equation should we use?": "Ποια εξίσωση βασικού μεταβολισμού να χρησιμοποιήσουμε;",
    "The Mifflin-St Jeor equation has two variants. This picks which one, and nothing else.":
      "Η εξίσωση Mifflin-St Jeor έχει δύο εκδοχές. Αυτό διαλέγει ποια, και τίποτα άλλο.",
    "Female\": \"Γυναίκα\", \"Male": "Άνδρας",
    "An honest week — how much do you move?": "Μια ειλικρινής εβδομάδα — πόσο κινείσαι;",
    "Count what you did last week, not what you meant to.":
      "Μέτρα τι έκανες την περασμένη εβδομάδα, όχι τι σκόπευες.",
    "Desk job, no training": "Γραφείο, καθόλου προπόνηση",
    "Light — 1 to 2 sessions": "Ελαφριά — 1 με 2 προπονήσεις",
    "Moderate — 3 to 4 sessions": "Μέτρια — 3 με 4 προπονήσεις",
    "Hard — 5 to 6 sessions": "Έντονη — 5 με 6 προπονήσεις",
    "Physical job or twice a day": "Χειρωνακτική δουλειά ή δύο φορές τη μέρα",
    "How do you eat, and does anything here apply?": "Πώς τρως, και ισχύει κάτι από αυτά;",
    "The safety questions decide whether we can give you an automatic estimate at all. Answer them honestly — nothing is stored.":
      "Οι ερωτήσεις ασφάλειας κρίνουν αν μπορούμε καν να σου δώσουμε αυτόματη εκτίμηση. Απάντησε ειλικρινά — τίποτα δεν αποθηκεύεται.",
    "Dietary style": "Διατροφικό στιλ",
    "I eat everything": "Τρώω τα πάντα",
    "Pescatarian — fish, no meat": "Πεσκεταριανός — ψάρι, όχι κρέας",
    "Vegetarian\": \"Χορτοφάγος\", \"Vegan\": \"Vegan\", \"No pork\": \"Χωρίς χοιρινό\", \"Halal": "Halal",
    "Tick anything that applies to you": "Σημείωσε ό,τι ισχύει για σένα",
    "Pregnant or breastfeeding": "Εγκυμοσύνη ή θηλασμός",
    "A current or previous eating disorder": "Τρέχουσα ή προηγούμενη διατροφική διαταραχή",
    "Diabetes or a diagnosed metabolic condition": "Διαβήτης ή διαγνωσμένη μεταβολική πάθηση",
    "A kidney, liver or serious gut condition": "Πάθηση νεφρών, ήπατος ή σοβαρή γαστρεντερική",
    "A severe food allergy": "Σοβαρή τροφική αλλεργία",
    "I follow a medically prescribed diet": "Ακολουθώ ιατρικά συνταγογραφημένη δίαιτα",
    "Medication affecting appetite, blood sugar or weight": "Φαρμακευτική αγωγή που επηρεάζει όρεξη, σάκχαρο ή βάρος",
    "None of these apply to me": "Δεν ισχύει κανένα από αυτά",

    /* result */
    "Your estimated starting range": "Το εκτιμώμενο αρχικό σου εύρος",
    "Estimated daily calories": "Εκτιμώμενες ημερήσιες θερμίδες",
    "Calories a day": "Θερμίδες τη μέρα",
    "Protein\": \"Πρωτεΐνη\", \"Carbs\": \"Υδατάνθρακες\", \"Fat": "Λιπαρά",
    "Suggested protein range": "Προτεινόμενο εύρος πρωτεΐνης",
    "Maintenance estimate": "Εκτίμηση συντήρησης",
    "Your goal": "Ο στόχος σου",
    "Height-to-weight ratio": "Δείκτης ύψους προς βάρος",
    "Locked": "Κλειδωμένο",
    "The full 28 days, portions, swaps and shopping list are in the personalised guide.":
      "Οι 28 μέρες, οι μερίδες, οι εναλλακτικές και η λίστα ψωνιών είναι στον εξατομικευμένο οδηγό.",
    "Get my guide": "Πάρε τον οδηγό μου",
    "Representative layout. Your guide is built from your own answers.":
      "Ενδεικτική διάταξη. Ο οδηγός σου χτίζεται από τις δικές σου απαντήσεις.",
    "We are not the right fit for this": "Δεν είμαστε το σωστό εργαλείο για αυτό",
    "Change my answers": "Άλλαξε τις απαντήσεις μου",

    /* how it works / receive */
    "Three steps, then it is in your inbox": "Τρία βήματα, και είναι στο email σου",
    "Tell us about your goal and routine": "Πες μας τον στόχο και τη ρουτίνα σου",
    "We match the guide to your answers": "Ταιριάζουμε τον οδηγό στις απαντήσεις σου",
    "Receive your digital guide by email": "Λαμβάνεις τον ψηφιακό οδηγό με email",
    "What you receive": "Τι λαμβάνεις",
    "One guide, built around your answers": "Ένας οδηγός, χτισμένος από τις απαντήσεις σου",
    "A personalised 28-day meal structure": "Εξατομικευμένη δομή γευμάτων 28 ημερών",
    "Your calorie and protein starting ranges": "Τα αρχικά σου εύρη θερμίδων και πρωτεΐνης",
    "Portion guidance for every meal": "Οδηγίες μερίδων για κάθε γεύμα",
    "Meal alternatives and food swaps": "Εναλλακτικά γεύματα και αντικαταστάσεις",
    "A shopping list organised by aisle": "Λίστα ψωνιών οργανωμένη ανά διάδρομο",
    "Practical guidance for busy days and eating out": "Πρακτικές οδηγίες για γεμάτες μέρες και φαγητό έξω",
    "A simple habit checklist": "Μια απλή λίστα συνηθειών",
    "Digital PDF, yours to keep": "Ψηφιακό PDF, δικό σου για πάντα",

    /* suitability */
    "Before you buy": "Πριν αγοράσεις",
    "Is this for me?": "Είναι για μένα;",
    "Suitable for": "Κατάλληλο για",
    "Not suitable for": "Ακατάλληλο για",
    "Healthy adults aged 18 and over": "Υγιείς ενήλικες 18 ετών και άνω",
    "People who want general meal organisation": "Άτομα που θέλουν γενική οργάνωση γευμάτων",
    "People wanting practical structure around a general weight goal":
      "Άτομα που θέλουν πρακτική δομή γύρω από έναν γενικό στόχο βάρους",
    "People without medical dietary requirements": "Άτομα χωρίς ιατρικές διατροφικές ανάγκες",
    "Anyone under 18": "Οποιονδήποτε κάτω των 18",
    "Pregnancy or breastfeeding": "Εγκυμοσύνη ή θηλασμό",
    "Current or previous eating disorders": "Τρέχουσες ή προηγούμενες διατροφικές διαταραχές",
    "Diabetes or diagnosed metabolic conditions": "Διαβήτη ή διαγνωσμένες μεταβολικές παθήσεις",
    "Kidney, liver or serious gastrointestinal conditions": "Παθήσεις νεφρών, ήπατος ή σοβαρές γαστρεντερικές",
    "Severe food allergies": "Σοβαρές τροφικές αλλεργίες",
    "Anyone on a medically prescribed diet": "Όσους ακολουθούν ιατρικά συνταγογραφημένη δίαιτα",
    "Anyone whose medication affects appetite, blood sugar or weight":
      "Όσους η φαρμακευτική αγωγή επηρεάζει όρεξη, σάκχαρο ή βάρος",

    /* pricing */
    "The guide": "Ο οδηγός",
    "Personalised Nutrition & Meal-Planning Guide": "Εξατομικευμένος Οδηγός Διατροφής & Προγραμματισμού Γευμάτων",
    "Get My Personalised Guide": "Πάρε τον Εξατομικευμένο Οδηγό μου",
    "Secure payment • Digital delivery • One-time payment": "Ασφαλής πληρωμή • Ψηφιακή παράδοση • Εφάπαξ πληρωμή",
    "Launch offer": "Προσφορά έναρξης",
    "Regular price": "Κανονική τιμή",
    "from": "από",
    "A goal-based nutrition guide": "Οδηγός διατροφής με βάση τον στόχο σου",
    "Suggested daily calories and macronutrient targets": "Προτεινόμενες ημερήσιες θερμίδες και στόχοι μακροθρεπτικών",
    "A full 28-day meal plan, matched to your preferences": "Πλήρες πλάνο γευμάτων 28 ημερών, στις προτιμήσεις σου",
    "Portion guidance": "Οδηγίες μερίδων",
    "Shopping list": "Λίστα για ψώνια",
    "Practical tips for staying consistent": "Πρακτικές συμβουλές για να είσαι συνεπής",
    "Digital PDF delivery after you complete the questionnaire": "Παράδοση ψηφιακού PDF αφού συμπληρώσεις το ερωτηματολόγιο",
    "Healthy Recipes eBook": "eBook Υγιεινών Συνταγών",
    "A separate recipe collection in the same format. Optional — your guide is complete without it.":
      "Μια ξεχωριστή συλλογή συνταγών στην ίδια μορφή. Προαιρετικό — ο οδηγός σου είναι πλήρης και χωρίς αυτό.",
    "Add the": "Πρόσθεσε το",
    "for only": "μόνο με",
    "One guide, one payment": "Ένας οδηγός, μία πληρωμή",
    "One-time payment · No subscription": "Εφάπαξ πληρωμή · Χωρίς συνδρομή",
    "Personalised 28-day meal structure": "Εξατομικευμένη δομή γευμάτων 28 ημερών",
    "Calorie and protein starting ranges": "Αρχικά εύρη θερμίδων και πρωτεΐνης",
    "Portions, alternatives and swaps": "Μερίδες, εναλλακτικές και αντικαταστάσεις",
    "Shopping list and busy-day guidance": "Λίστα ψωνιών και οδηγίες για γεμάτες μέρες",
    "Digital PDF by email": "Ψηφιακό PDF με email",
    "Delivered as a PDF": "Παραδίδεται ως PDF",
    "Add": "Πρόσθεσε",

    /* faq */
    "Questions": "Ερωτήσεις",
    "Before you ask": "Πριν ρωτήσεις",
    "Is this a medical diet plan?": "Είναι ιατρικό διαιτολόγιο;",
    "Who creates the guide?": "Ποιος φτιάχνει τον οδηγό;",
    "How personalised is it?": "Πόσο εξατομικευμένο είναι;",
    "When will I receive it?": "Πότε θα το λάβω;",
    "What format will I receive?": "Σε τι μορφή θα το λάβω;",
    "Can I use it if I have a medical condition?": "Μπορώ να το χρησιμοποιήσω αν έχω πάθηση;",
    "Can I request substitutions?": "Μπορώ να ζητήσω αντικαταστάσεις;",
    "Is this a subscription?": "Είναι συνδρομή;",
    "What is the refund policy?": "Ποια είναι η πολιτική επιστροφών;",
    "How is my information used?": "Πώς χρησιμοποιούνται τα στοιχεία μου;",
    "What exactly are you, legally?": "Τι ακριβώς είστε, νομικά;",

    /* final + footer */
    "Your goal. Your food. Your month.": "Ο στόχος σου. Το φαγητό σου. Ο μήνας σου.",
    "A practical starting structure, matched to your preferences and designed for a real schedule.":
      "Μια πρακτική αρχική δομή, ταιριασμένη στις προτιμήσεις σου και σχεδιασμένη για πραγματικό πρόγραμμα.",
    "ευ ζω — to live well": "ευ ζω — να ζεις καλά",
    "Terms and Conditions": "Όροι Χρήσης",
    "Privacy Policy": "Πολιτική Απορρήτου",
    "Cookie Policy": "Πολιτική Cookies",
    "Refund and Digital Delivery": "Επιστροφές και Ψηφιακή Παράδοση",
    "Contact": "Επικοινωνία",
    "Scope:": "Πεδίο:",
    "Scope: ": "Πεδίο: ",

    /* food picker */
    "Which of these do you actually eat?": "Ποια από αυτά τρως πραγματικά;",
    "Tick everything you would happily eat in a normal week. Anything you leave unticked stays out of your plan, so do not tick a food out of politeness. The list already follows the dietary style you chose.":
      "Τσέκαρε ό,τι θα έτρωγες ευχαρίστως σε μια κανονική εβδομάδα. Ό,τι αφήσεις ατσέκαρο μένει εκτός πλάνου, οπότε μην τσεκάρεις κάτι από ευγένεια. Η λίστα ακολουθεί ήδη το διατροφικό στιλ που διάλεξες.",
    "Pick at least two proteins and two carbohydrate foods. Fewer than that and the week has nothing to be built from.":
      "Διάλεξε τουλάχιστον δύο πρωτεΐνες και δύο τροφές υδατανθράκων. Με λιγότερα, η εβδομάδα δεν έχει από τι να χτιστεί.",
    "Pick at least two proteins and two carbohydrate foods so there is something to build the week from.":
      "Διάλεξε τουλάχιστον δύο πρωτεΐνες και δύο τροφές υδατανθράκων για να υπάρχει από τι να χτιστεί η εβδομάδα.",
    "Foods you picked": "Τροφές που διάλεξες",
    "Protein": "Πρωτεΐνη",
    "Carbohydrate": "Υδατάνθρακες",
    "Vegetables": "Λαχανικά",
    "Fats": "Λιπαρά",
    "Chicken": "Κοτόπουλο",
    "Turkey": "Γαλοπούλα",
    "Beef": "Μοσχάρι",
    "Lamb": "Αρνί",
    "Pork": "Χοιρινό",
    "Fish": "Ψάρι",
    "Prawns and seafood": "Γαρίδες και θαλασσινά",
    "Eggs": "Αυγά",
    "Greek yoghurt": "Ελληνικό γιαούρτι",
    "Feta and cheese": "Φέτα και τυριά",
    "Lentils, beans, chickpeas": "Φακές, φασόλια, ρεβίθια",
    "Tofu and soya": "Τόφου και σόγια",
    "Bread": "Ψωμί",
    "Rice": "Ρύζι",
    "Pasta": "Ζυμαρικά",
    "Potatoes": "Πατάτες",
    "Oats": "Βρώμη",
    "Bulgur and couscous": "Πλιγούρι και κους κους",
    "Fruit": "Φρούτα",
    "Salad and leafy greens": "Σαλάτα και χόρτα",
    "Tomatoes and cucumber": "Ντομάτα και αγγούρι",
    "Roasted vegetables": "Ψητά λαχανικά",
    "Olives": "Ελιές",
    "Olive oil": "Ελαιόλαδο",
    "Home": "Αρχική",
    "Shop": "Κατάστημα",
    "Blog": "Blog",
    "The shop": "Το κατάστημα",
    "Cookie settings": "Ρυθμίσεις cookies",
    "Your choice, not ours": "Δική σου επιλογή, όχι δική μας",
    "EVZO sets no cookies and loads nothing from anyone else — the fonts are on our own server, so nothing about your visit is sent to Google or anybody. If we ever add analytics or advertising, it will only run if you tick it here first.": "Το EVZO δεν βάζει cookies και δεν φορτώνει τίποτα από τρίτους — οι γραμματοσειρές είναι στον δικό μας διακομιστή, οπότε τίποτα από την επίσκεψή σου δεν στέλνεται στην Google ή σε κανέναν. Αν προσθέσουμε ποτέ στατιστικά ή διαφήμιση, θα τρέξουν μόνο αν το επιλέξεις εδώ πρώτα.",
    "Strictly necessary": "Απολύτως απαραίτητα",
    "Remembering this choice, and your basket at checkout. Cannot be switched off.": "Η απομνημόνευση αυτής της επιλογής και του καλαθιού σου στο ταμείο. Δεν απενεργοποιείται.",
    "Always on": "Πάντα ενεργά",
    "Analytics": "Στατιστικά",
    "Anonymous counts of which pages get read. Never your answers, your weight or your email.": "Ανώνυμη καταμέτρηση του ποιες σελίδες διαβάζονται. Ποτέ οι απαντήσεις σου, το βάρος σου ή το email σου.",
    "Advertising": "Διαφήμιση",
    "Lets us see which adverts led to a sale. Nothing health-related is ever sent.": "Μας δείχνει ποιες διαφημίσεις οδήγησαν σε πώληση. Τίποτα σχετικό με την υγεία δεν στέλνεται ποτέ.",
    "Reject all": "Απόρριψη όλων",
    "Accept all": "Αποδοχή όλων",
    "Save my choice": "Αποθήκευση επιλογής",
    "You can change this at any time from “Cookie settings” at the bottom of any page.": "Μπορείς να το αλλάξεις οποιαδήποτε στιγμή από τις «Ρυθμίσεις cookies» στο κάτω μέρος κάθε σελίδας.",
    "Cookie policy": "Πολιτική cookies",
    "Know exactly": "Μάθε ακριβώς",
    "what you are eating": "τι τρως",
    "Greek and Cypriot recipes with the calories and protein already worked out. No app, no weighing everything, no guessing.": "Ελληνικές και κυπριακές συνταγές με τις θερμίδες και την πρωτεΐνη ήδη υπολογισμένες. Χωρίς εφαρμογή, χωρίς να ζυγίζεις τα πάντα, χωρίς μαντεψιές.",
    "days": "ημέρες",
    "habits to choose from": "συνήθειες για επιλογή",
    "weekly reviews": "εβδομαδιαίες ανασκοπήσεις",
    "The 28-Day Workbook": "Το τετράδιο 28 ημερών",
    "Build the habit": "Χτίσε τη συνήθεια",
    "Or message": "Ή στείλε μήνυμα στο",
    "to order": "για παραγγελία",
    "Day plan": "Ημέρες πλάνο",
    "Recipes": "Συνταγές",
    "Ingredients costed": "Υλικά υπολογισμένα",
    "Training plans": "Πλάνα προπόνησης",
    "Counted, not claimed. Every calorie and macro figure behind these numbers is computed from a table of standard published values — none of them is typed by hand and none is estimated by a language model.": "Μετρημένα, όχι δηλωμένα. Κάθε νούμερο θερμίδων και μακροθρεπτικών πίσω από αυτά υπολογίζεται από πίνακα με πρότυπες δημοσιευμένες τιμές — κανένα δεν γράφτηκε με το χέρι και κανένα δεν το εκτίμησε γλωσσικό μοντέλο.",
    "The app · optional": "Η εφαρμογή · προαιρετικά",
    "The guide, but it keeps up with you": "Ο οδηγός, αλλά σε ακολουθεί",
    "The guide is a PDF and it never changes. The app is the same plan, live — it knows what day you are on, what you have eaten and what is left.": "Ο οδηγός είναι PDF και δεν αλλάζει ποτέ. Η εφαρμογή είναι το ίδιο πλάνο, ζωντανά — ξέρει σε ποια μέρα είσαι, τι έφαγες και τι απομένει.",
    "Today, not a document.": "Σήμερα, όχι έγγραφο.",
    "Your day, your four meals, your remaining calories and protein.": "Η μέρα σου, τα γεύματά σου, οι θερμίδες και η πρωτεΐνη που απομένουν.",
    "A food log that speaks Greek.": "Ημερολόγιο φαγητού στα ελληνικά.",
    "Search χαλλούμι and find halloumi. Most trackers cannot.": "Ψάχνεις «χαλλούμι» και το βρίσκει. Οι περισσότερες εφαρμογές δεν μπορούν.",
    "Swap a meal without breaking the day.": "Άλλαξε γεύμα χωρίς να χαλάσει η μέρα.",
    "Alternatives that fit the same numbers and the same allergies.": "Εναλλακτικές που ταιριάζουν στα ίδια νούμερα και στις ίδιες αλλεργίες.",
    "Weekly shopping list.": "Εβδομαδιαία λίστα για ψώνια.",
    "Built from the week you are actually going to cook.": "Φτιαγμένη από την εβδομάδα που πραγματικά θα μαγειρέψεις.",
    "Nothing to install.": "Τίποτα για εγκατάσταση.",
    "It runs in the browser on a phone.": "Τρέχει στον browser του κινητού.",
    "See the price": "Δες την τιμή",
    "Free": "Δωρεάν",
    "Read it before you buy anything": "Διάβασέ το πριν αγοράσεις οτιδήποτε",
    "Full recipes with every figure computed, and plain explanations of the things everyone gets wrong. Published in the open so you can check the arithmetic before you trust it.": "Ολόκληρες συνταγές με κάθε νούμερο υπολογισμένο, και απλές εξηγήσεις για όσα οι περισσότεροι κάνουν λάθος. Δημοσιευμένα ανοιχτά, ώστε να ελέγξεις τα μαθηματικά πριν τα εμπιστευτείς.",
    "Recipe": "Συνταγή",
    "Overnight oats, and the arithmetic": "Βρώμη ολονύκτια, και τα νούμερα",
    "The whole recipe free, plus the three places a jar of oats turns into an 800-calorie dessert.": "Ολόκληρη η συνταγή δωρεάν, και τα τρία σημεία όπου ένα βάζο βρώμης γίνεται επιδόρπιο 800 θερμίδων.",
    "Strapatsada, counted": "Στραπατσάδα, μετρημένη",
    "The August breakfast that needs no rebuilding — and the one habit that makes it heavy.": "Το πρωινό του Αυγούστου που δεν χρειάζεται αλλαγή — και η μία συνήθεια που το βαραίνει.",
    "Why you are hungry on every diet": "Γιατί πεινάς σε κάθε δίαιτα",
    "It is not willpower and it is not your metabolism. It is that the plate got smaller.": "Δεν φταίει η θέληση ούτε ο μεταβολισμός. Φταίει ότι το πιάτο μίκρυνε.",
    "Read it →": "Διάβασέ το →",
    "All articles →": "Όλα τα άρθρα →",
    "Eight books, every figure computed": "Οκτώ βιβλία, κάθε νούμερο υπολογισμένο",
    "Recipe collections and training plans at a fixed price, separate from the personalised guide. Buy the one that matches the problem you have.": "Συλλογές συνταγών και πλάνα προπόνησης σε σταθερή τιμή, ξεχωριστά από τον εξατομικευμένο οδηγό. Πάρε αυτό που ταιριάζει στο πρόβλημα που έχεις.",
    "Recipe books.": "Βιβλία συνταγών.",
    "Oats, eggs, protein bowls, dinners, fat loss, weight gain.": "Βρώμη, αυγά, bowls πρωτεΐνης, βραδινά, απώλεια λίπους, αύξηση βάρους.",
    "Workout plans.": "Πλάνα προπόνησης.",
    "Five plans with the calories each session burns estimated from published MET values — and the margin of error printed beside them.": "Πέντε πλάνα, με τις θερμίδες κάθε προπόνησης υπολογισμένες από δημοσιευμένες τιμές MET — και το περιθώριο σφάλματος δίπλα τους.",
    "Every number derived.": "Κάθε νούμερο παράγεται.",
    "Change an ingredient quantity and the figure changes, because it is arithmetic.": "Άλλαξε μια ποσότητα υλικού και το νούμερο αλλάζει, γιατί είναι αριθμητική.",
    "Pick how long you want it for": "Διάλεξε για πόσο καιρό το θέλεις",
    "The same guide either way. The longer packages cost less a month because the targets get rebuilt as your weight moves — which is the part a single month cannot do.": "Ο ίδιος οδηγός και στις δύο περιπτώσεις. Τα μεγαλύτερα πακέτα κοστίζουν λιγότερο τον μήνα γιατί οι στόχοι ξαναχτίζονται καθώς αλλάζει το βάρος σου — κάτι που ένας μόνο μήνας δεν μπορεί να κάνει.",
    "Recommended": "Προτεινόμενο",
    "28 days": "28 ημέρες",
    "3 months": "3 μήνες",
    "6 months": "6 μήνες",
    "One month": "Ένας μήνας",
    "a month": "τον μήνα",
    "Saves": "Γλιτώνεις",
    "against 28 days at a time": "σε σχέση με 28 ημέρες τη φορά",
    "One month, built from your answers.": "Ένας μήνας, φτιαγμένος από τις απαντήσεις σου.",
    "Three guides, rebuilt each month as your numbers move.": "Τρεις οδηγοί, ξαναχτισμένοι κάθε μήνα καθώς αλλάζουν τα νούμερά σου.",
    "Six months, plus every ebook in the shop.": "Έξι μήνες, μαζί με κάθε ebook του καταστήματος.",
    "A personalised 28-day guide": "Εξατομικευμένος οδηγός 28 ημερών",
    "Calorie and protein targets from your own measurements": "Στόχοι θερμίδων και πρωτεΐνης από τις δικές σου μετρήσεις",
    "Meals filtered by your allergies, dislikes and cooking time": "Γεύματα φιλτραρισμένα από τις αλλεργίες, τις αντιπάθειες και τον χρόνο μαγειρέματος",
    "A weekly shopping list": "Εβδομαδιαία λίστα για ψώνια",
    "Everything in 28 days, three times over": "Όλα των 28 ημερών, τρεις φορές",
    "Rebuilt monthly — targets recalculated as your weight changes": "Ξαναχτίζεται κάθε μήνα — οι στόχοι υπολογίζονται ξανά καθώς αλλάζει το βάρος σου",
    "A check-in before each rebuild, so it follows what actually happened": "Ένα check-in πριν από κάθε ανανέωση, ώστε να ακολουθεί τι πραγματικά έγινε",
    "Different meals each month, so month three is not month one again": "Διαφορετικά γεύματα κάθε μήνα, ώστε ο τρίτος μήνας να μην είναι ξανά ο πρώτος",
    "Everything in 3 months, for six months": "Όλα των 3 μηνών, για έξι μήνες",
    "The whole ebook library — every recipe and training book": "Όλη η συλλογή ebook — κάθε βιβλίο συνταγών και προπόνησης",
    "Six months is long enough for the result to be the habit, not the month": "Έξι μήνες είναι αρκετοί ώστε το αποτέλεσμα να είναι η συνήθεια, όχι ο μήνας",
    "One-time payment · 3 guides · No subscription": "Εφάπαξ πληρωμή · 3 οδηγοί · Χωρίς συνδρομή",
    "One-time payment · 6 guides · No subscription": "Εφάπαξ πληρωμή · 6 οδηγοί · Χωρίς συνδρομή",
    "out of 5": "στα 5",
    "review": "κριτική",
    "reviews": "κριτικές",
    "Every review here is from someone who received the guide and gave permission to be quoted. Trimmed for length, never reworded.": "Κάθε κριτική εδώ είναι από κάποιον που έλαβε τον οδηγό και έδωσε άδεια να αναφερθεί. Συντομευμένες σε μήκος, ποτέ ξαναγραμμένες.",
    "Stay in touch": "Μείνε σε επαφή",
    "One email, when there is something worth sending": "Ένα email, όταν υπάρχει κάτι που αξίζει",
    "New recipes with the figures worked out, and the occasional thing most nutrition advice gets wrong. No daily mail, no selling your address on.": "Νέες συνταγές με τα νούμερα υπολογισμένα, και πού και πού κάτι που οι περισσότερες διατροφικές συμβουλές το λένε λάθος. Όχι καθημερινά email, και η διεύθυνσή σου δεν πωλείται πουθενά.",
    "Send it": "Στείλ' το",
    "Your address is used to send you these emails and nothing else. Unsubscribe in one click. See the privacy policy below.": "Η διεύθυνσή σου χρησιμοποιείται για να σου στέλνουμε αυτά τα email και τίποτε άλλο. Διαγραφή με ένα κλικ. Δες την πολιτική απορρήτου παρακάτω.",
    "That does not look like an email address.": "Αυτό δεν μοιάζει με διεύθυνση email.",
    "Thank you. Your mail app should open — send it and you are on the list.": "Ευχαριστούμε. Θα ανοίξει η εφαρμογή email σου — στείλε το και μπήκες στη λίστα.",
    "They are not personalised. The numbers are per serving, not per person — if you want figures built around your own body and routine, that is": "Δεν είναι εξατομικευμένα. Τα νούμερα είναι ανά μερίδα, όχι ανά άτομο — αν θέλεις νούμερα χτισμένα γύρω από το δικό σου σώμα και πρόγραμμα, αυτό είναι",
    "the guide": "ο οδηγός",
    ", not these.": ", όχι αυτά.",
    "Recipe and training books for Greek and Cypriot kitchens. Every calorie, protein and macro figure is calculated from the ingredient beside it, and every burn figure from a published MET value — not estimated, not rounded up to look better, and not written by a machine that guesses.": "Βιβλία συνταγών και προπόνησης για ελληνικές και κυπριακές κουζίνες. Κάθε νούμερο θερμίδων και μακροθρεπτικών υπολογίζεται από το υλικό δίπλα του, και κάθε νούμερο κατανάλωσης από δημοσιευμένη τιμή MET — χωρίς εκτιμήσεις, χωρίς στρογγυλοποιήσεις και χωρίς μηχανή που μαντεύει.",
    "training plans": "πλάνα προπόνησης",
    "plans": "πλάνα",
    "days a week": "μέρες τη βδομάδα",
    "activities costed": "δραστηριότητες υπολογισμένες",
    "Five plans from three days a week to five, with the calories each session burns estimated from published MET values — and the margin of error printed beside them.": "Πέντε πλάνα, από τρεις μέρες τη βδομάδα έως πέντε, με τις θερμίδες κάθε προπόνησης υπολογισμένες από δημοσιευμένες τιμές MET — και το περιθώριο σφάλματος δίπλα τους.",
    "for all": "για και τα",
    "Get the whole library": "Πάρε όλη τη συλλογή",
    "Every book in the shop, in one download.": "Κάθε βιβλίο του καταστήματος, σε ένα αρχείο.",
    "Workout Plans": "Πλάνα προπόνησης",
    "Training": "Προπόνηση",
    "Five plans, no guesswork": "Πέντε πλάνα, χωρίς μαντεψιές",
    "There is no filler in these books. No life story before the ingredients, no stock photography, no \"serves 4–6\".": "Δεν υπάρχει γέμισμα σε αυτά τα βιβλία. Καμία ιστορία ζωής πριν τα υλικά, καμία φωτογραφία αρχείου, κανένα «για 4–6 άτομα».",
    "Calories, protein, carbohydrate and fat per serving, plus the EVZO protein score — grams of protein per 100 calories. Change a quantity in the ingredient list and the figure changes with it, because it is arithmetic, not a claim.": "Θερμίδες, πρωτεΐνη, υδατάνθρακες και λιπαρά ανά μερίδα, μαζί με το σκορ πρωτεΐνης του EVZO — γραμμάρια πρωτεΐνης ανά 100 θερμίδες. Άλλαξε μια ποσότητα στα υλικά και το νούμερο αλλάζει μαζί της, γιατί είναι αριθμητική, όχι ισχυρισμός.",
    "Every ingredient in grams, including the oil. A level tablespoon of olive oil is about 119 calories and a pour is closer to 350 — which is where most \"healthy\" cooking quietly goes wrong.": "Κάθε υλικό σε γραμμάρια, μαζί και το λάδι. Μια κοφτή κουταλιά ελαιόλαδο είναι περίπου 119 θερμίδες και μια ελεύθερη ροή πιο κοντά στις 350 — εκεί χαλάει αθόρυβα το περισσότερο «υγιεινό» μαγείρεμα.",
    "One short paragraph per recipe explaining the decision that matters — the swap, the technique, the thing people get wrong. You should be able to cook without the book after a fortnight.": "Μια σύντομη παράγραφος ανά συνταγή που εξηγεί την απόφαση που μετράει — την αλλαγή, την τεχνική, αυτό που οι περισσότεροι κάνουν λάθος. Σε δύο εβδομάδες πρέπει να μαγειρεύεις χωρίς το βιβλίο.",
    "Two alternatives per recipe for the ingredient you do not have or do not eat, with the consequence stated when there is one.": "Δύο εναλλακτικές ανά συνταγή για το υλικό που δεν έχεις ή δεν τρως, με τη συνέπεια γραμμένη όπου υπάρχει.",
    "They are not personalised. The numbers are per serving, not per person — if you want figures built around your own body and routine, that is the guide, not these.": "Δεν είναι εξατομικευμένα. Τα νούμερα είναι ανά μερίδα, όχι ανά άτομο — αν θέλεις νούμερα χτισμένα γύρω από το δικό σου σώμα και πρόγραμμα, αυτό είναι ο οδηγός, όχι αυτά.",
    "They are not medical or dietetic advice. EVZO is not run by dietitians, nutritionists or doctors and does not present itself as any of those.": "Δεν είναι ιατρική ή διαιτολογική συμβουλή. Το EVZO δεν το τρέχουν διαιτολόγοι, διατροφολόγοι ή γιατροί και δεν παρουσιάζεται ως τέτοιο.",
    "They are not a diet. Nothing is banned in any of them.": "Δεν είναι δίαιτα. Τίποτα δεν απαγορεύεται σε κανένα από αυτά.",
    "Figures vary with brand, cut and cooking. They are close, not exact, and the books say so on the page rather than in the small print.": "Τα νούμερα αλλάζουν ανάλογα με μάρκα, κομμάτι και μαγείρεμα. Είναι κοντινά, όχι ακριβή, και τα βιβλία το λένε στη σελίδα, όχι στα ψιλά γράμματα.",
    "Every number on": "Κάθε νούμερο",
    "the page is real": "στη σελίδα είναι αληθινό",
    "Food, written": "Φαγητό, γραμμένο",
    "with the numbers in": "με τα νούμερα μέσα",
    "Every number on the page is real": "Κάθε νούμερο στη σελίδα είναι αληθινό",
    "Recipe books for Greek and Cypriot kitchens. Every calorie, protein, carb and fat figure in every book is calculated from the ingredient list beside it — not estimated, not rounded up to look better, and not written by a machine that guesses.": "Βιβλία συνταγών για ελληνικές και κυπριακές κουζίνες. Κάθε νούμερο θερμίδων, πρωτεΐνης, υδατανθράκων και λιπαρών υπολογίζεται από τη λίστα υλικών δίπλα του — δεν εκτιμάται, δεν στρογγυλοποιείται για να φαίνεται καλύτερο και δεν το γράφει μηχανή που μαντεύει.",
    "books": "βιβλία",
    "recipes in total": "συνταγές συνολικά",
    "Every figure computed": "Κάθε νούμερο υπολογισμένο",
    "PDF, delivered by email": "PDF, με email",
    "The whole library": "Όλη η συλλογή",
    "for all seven": "και τα επτά",
    "All seven recipe books in one download.": "Και τα επτά βιβλία συνταγών σε ένα αρχείο.",
    "Get all seven": "Πάρε και τα επτά",
    "Bought one at a time": "Αν τα πάρεις ένα ένα",
    "One at a time": "Ένα ένα",
    "The books": "Τα βιβλία",
    "Buy the one that matches the problem you actually have. They are the same format and they do not overlap.": "Πάρε αυτό που ταιριάζει στο πρόβλημα που έχεις πραγματικά. Έχουν την ίδια μορφή και δεν επικαλύπτονται.",
    "Buy": "Αγορά",
    "recipes": "συνταγές",
    "kcal a serving": "θερμίδες η μερίδα",
    "protein, average": "πρωτεΐνη, μέσος όρος",
    "Oat Recipes": "Συνταγές με βρώμη",
    "Egg Recipes": "Συνταγές με αυγά",
    "High-Protein Bowls": "Bowls με πολλή πρωτεΐνη",
    "High-Protein Dinners": "Βραδινά με πολλή πρωτεΐνη",
    "Fat Loss Dishes": "Πιάτα για απώλεια λίπους",
    "Weight Gain": "Αύξηση βάρους",
    "Healthy Recipes": "Υγιεινές συνταγές",
    "Breakfast": "Πρωινό",
    "The cheapest protein there is": "Η φθηνότερη πρωτεΐνη που υπάρχει",
    "Lunch": "Μεσημεριανό",
    "Dinner": "Βραδινό",
    "Losing weight": "Απώλεια βάρους",
    "Gaining weight": "Αύξηση βάρους",
    "The starter collection": "Η πρώτη συλλογή",
    "Oats, fourteen ways": "Βρώμη, δεκατέσσερις τρόποι",
    "One bowl, thirty grams": "Ένα bowl, τριάντα γραμμάρια",
    "Dinners that hold": "Βραδινά που σε κρατούν",
    "Full plates, fewer calories": "Γεμάτα πιάτα, λιγότερες θερμίδες",
    "Eating more, on purpose": "Τρως περισσότερο, επίτηδες",
    "Real food, weighed once": "Αληθινό φαγητό, ζυγισμένο μία φορά",
    "Fourteen ways to eat oats that are not porridge — overnight jars, baked oats, savoury bowls, pancakes and bars.": "Δεκατέσσερις τρόποι να φας βρώμη που δεν είναι χυλός — βάζα για το βράδυ, βρώμη στον φούρνο, αλμυρά bowls, τηγανίτες και μπάρες.",
    "Fourteen egg dishes, from strapatsada to a protein box that needs no reheating. Six eggs is a dinner for four.": "Δεκατέσσερα πιάτα με αυγά, από στραπατσάδα μέχρι ένα κουτί πρωτεΐνης που δεν θέλει ζέσταμα. Έξι αυγά είναι βραδινό για τέσσερις.",
    "Mediterranean bowls built around the protein first. Most of them one pan, all of them assembled in minutes.": "Μεσογειακά bowls χτισμένα πρώτα γύρω από την πρωτεΐνη. Τα περισσότερα σε ένα τηγάνι, όλα έτοιμα σε λίγα λεπτά.",
    "Greek and Cypriot dinners rebuilt so the protein is the point — including the ones you were told to give up.": "Ελληνικά και κυπριακά βραδινά ξαναχτισμένα ώστε η πρωτεΐνη να είναι το θέμα — μαζί και αυτά που σου είπαν να κόψεις.",
    "Meals built for volume, sorted by calories. Full plates, because hunger is what ends diets.": "Γεύματα φτιαγμένα για όγκο, ταξινομημένα κατά θερμίδες. Γεμάτα πιάτα, γιατί η πείνα είναι αυτή που τελειώνει τις δίαιτες.",
    "Calorie-dense meals and shakes for people who genuinely struggle to gain, built on real food.": "Πυκνά σε θερμίδες γεύματα και σέικ για όσους πραγματικά δυσκολεύονται να πάρουν βάρος, με αληθινό φαγητό.",
    "The collection offered at checkout. Breakfasts, lunches, dinners and snacks with every figure on the page.": "Η συλλογή που προσφέρεται στο ταμείο. Πρωινά, μεσημεριανά, βραδινά και σνακ, με όλα τα νούμερα στη σελίδα.",
    "What a page looks like": "Πώς μοιάζει μια σελίδα",
    "The same four things, every recipe": "Τα ίδια τέσσερα πράγματα, σε κάθε συνταγή",
    "The figures, computed": "Τα νούμερα, υπολογισμένα",
    "Weights, not handfuls": "Γραμμάρια, όχι χούφτες",
    "Why it is built that way": "Γιατί είναι φτιαγμένο έτσι",
    "Swaps that keep it honest": "Εναλλακτικές που το κρατούν τίμιο",
    "What these books are not": "Τι δεν είναι αυτά τα βιβλία",
    "How do I get the book after I pay?": "Πώς παίρνω το βιβλίο αφού πληρώσω;",
    "As a PDF, by email": "Ως PDF, με email",
    "It is a file, not a subscription. Download it once and it is yours on every device you own.": "Είναι αρχείο, όχι συνδρομή. Το κατεβάζεις μία φορά και είναι δικό σου σε κάθε συσκευή σου.",
    "Is this the same as the personalised guide?": "Είναι το ίδιο με τον εξατομικευμένο οδηγό;",
    "No. The books are fixed recipe collections at the same price for everyone. The guide is built from your own answers — your body, your goal, the food you actually eat — and it costs more because it is made for one person.": "Όχι. Τα βιβλία είναι σταθερές συλλογές συνταγών, στην ίδια τιμή για όλους. Ο οδηγός φτιάχνεται από τις δικές σου απαντήσεις — το σώμα σου, τον στόχο σου, το φαγητό που πραγματικά τρως — και κοστίζει περισσότερο γιατί είναι φτιαγμένος για έναν άνθρωπο.",
    "Can I get a refund?": "Μπορώ να πάρω τα λεφτά μου πίσω;",
    "Digital files come with a 14-day right of withdrawal in the EU, which you waive at checkout if you ask for the download immediately. If a file is broken or does not arrive, tell us and we will fix it or refund it.": "Τα ψηφιακά αρχεία έχουν δικαίωμα υπαναχώρησης 14 ημερών στην ΕΕ, το οποίο παραιτείσαι στο ταμείο αν ζητήσεις άμεση παράδοση. Αν ένα αρχείο είναι χαλασμένο ή δεν φτάσει, πες μας και θα το διορθώσουμε ή θα σου επιστρέψουμε τα χρήματα.",
    "Are the recipes in Greek?": "Οι συνταγές είναι στα ελληνικά;",
    "Every recipe carries its Greek name. The method and the notes are in English for now.": "Κάθε συνταγή έχει την ελληνική της ονομασία. Η εκτέλεση και οι σημειώσεις είναι προς το παρόν στα αγγλικά.",
    "Who worked out the numbers?": "Ποιος έβγαλε τα νούμερα;",
    "A program did, from a table of standard published values for each ingredient. Nobody typed a calorie figure by hand and no language model estimated one. That is the whole point of the format.": "Ένα πρόγραμμα, από πίνακα με πρότυπες δημοσιευμένες τιμές για κάθε υλικό. Κανείς δεν πληκτρολόγησε θερμίδες με το χέρι και κανένα γλωσσικό μοντέλο δεν τις εκτίμησε. Αυτό ακριβώς είναι το νόημα.",
    "Do I need to weigh everything forever?": "Πρέπει να ζυγίζω τα πάντα για πάντα;",
    "No. Weigh for two weeks and you will not need to again — the point of the scales is to calibrate your eye, not to live on your worktop.": "Όχι. Ζύγισε για δύο εβδομάδες και δεν θα χρειαστεί ξανά — η ζυγαριά είναι για να βαθμονομήσεις το μάτι σου, όχι για να μένει στον πάγκο.",
    "Any allergies or intolerances?": "Έχεις αλλεργίες ή δυσανεξίες;",
    "Anything ticked here is removed from every meal in the month — not reduced, removed. If it is a severe allergy, tell your doctor before changing how you eat, whatever a plan says.": "Ό,τι σημειώσεις εδώ αφαιρείται από κάθε γεύμα του μήνα — δεν μειώνεται, αφαιρείται. Αν πρόκειται για σοβαρή αλλεργία, μίλησε με τον γιατρό σου πριν αλλάξεις τον τρόπο που τρως, ό,τι κι αν λέει ένα πλάνο.",
    "Allergies": "Αλλεργίες",
    "Dairy": "Γαλακτοκομικά",
    "Gluten": "Γλουτένη",
    "Egg": "Αυγό",
    "Shellfish": "Οστρακοειδή",
    "Tree nuts": "Ξηροί καρποί",
    "Peanut": "Φιστίκι",
    "Soy": "Σόγια",
    "Sesame": "Σουσάμι",
    "None of these": "Κανένα από αυτά",
    "Tick any allergies, or tick “None of these”.": "Σημείωσε τις αλλεργίες σου ή διάλεξε «Κανένα από αυτά».",
    "How many times a day do you eat?": "Πόσες φορές την ημέρα τρως;",
    "The same calories split the way you actually eat. Three meals and a snack is the usual answer; two bigger meals suits people who skip breakfast.": "Οι ίδιες θερμίδες, μοιρασμένες όπως τρως πραγματικά. Τρία γεύματα και ένα σνακ είναι η συνηθισμένη απάντηση· δύο μεγαλύτερα γεύματα ταιριάζουν σε όσους δεν τρώνε πρωινό.",
    "Meals a day": "Γεύματα την ημέρα",
    "Snacks a day": "Σνακ την ημέρα",
    "Two": "Δύο",
    "Three": "Τρία",
    "Four": "Τέσσερα",
    "One": "Ένα",
    "None": "Κανένα",
    "Bigger plates, usually no breakfast.": "Μεγαλύτερες μερίδες, συνήθως χωρίς πρωινό.",
    "Breakfast, lunch, dinner. The default.": "Πρωινό, μεσημεριανό, βραδινό. Η προεπιλογή.",
    "Smaller and more often.": "Μικρότερα και πιο συχνά.",
    "Pick how many meals a day you eat.": "Διάλεξε πόσα γεύματα την ημέρα τρως.",
    "Pick how many snacks, even if the answer is none.": "Διάλεξε πόσα σνακ, ακόμη κι αν η απάντηση είναι κανένα.",
    "Pita and flatbread": "Πίτα και λαγάνα",
    "Sourdough": "Ψωμί με προζύμι",
    "Barley rusk": "Παξιμάδι",
    "Orzo": "Κριθαράκι",
    "Rice noodles": "Νουντλς ρυζιού",
    "Sweet potatoes": "Γλυκοπατάτες",
    "Granola": "Γκρανόλα",
    "Freekeh": "Φρίκε",
    "Trahana": "Τραχανάς",
    "Pearl barley": "Κριθάρι",
    "Quinoa": "Κινόα",
    "Buckwheat": "Φαγόπυρο",
    "Corn and polenta": "Καλαμπόκι και πολέντα",
    "Rice cakes": "Ρυζογκοφρέτες",
    "Wraps and tortillas": "Τορτίγιες και ρολά",
    "Almonds": "Αμύγδαλα",
    "Walnuts": "Καρύδια",
    "Pistachios": "Φιστίκια Αιγίνης",
    "Hazelnuts": "Φουντούκια",
    "Cashews": "Κάσιους",
    "Pine nuts": "Κουκουνάρι",
    "Peanut butter": "Φυστικοβούτυρο",
    "Almond butter": "Βούτυρο αμυγδάλου",
    "Sesame seeds": "Σουσάμι",
    "Pumpkin and sunflower seeds": "Κολοκυθόσπορος και ηλιόσποροι",
    "Chia and flaxseed": "Σπόροι chia και λιναρόσπορος",
    "Coconut and coconut oil": "Καρύδα και λάδι καρύδας",
    "Dark chocolate": "Μαύρη σοκολάτα",
    "Butter": "Βούτυρο",
    "Cream cheese": "Τυρί κρέμα",
    "Milk and drinks": "Γάλα και ροφήματα",
    "Cow’s milk": "Αγελαδινό γάλα",
    "Soy milk": "Γάλα σόγιας",
    "Almond milk": "Γάλα αμυγδάλου",
    "Oat milk": "Γάλα βρώμης",
    "Coconut milk": "Γάλα καρύδας",
    "Pea milk": "Γάλα αρακά",
    "Coffee": "Καφές",
    "Greek coffee": "Ελληνικός καφές",
    "Frappé and freddo": "Φραπέ και φρέντο",
    "Tea": "Τσάι",
    "Mountain and herbal tea": "Τσάι του βουνού και αφεψήματα",
    "Matcha": "Μάτσα",
    "Whey protein": "Πρωτεΐνη ορού γάλακτος",
    "Plant protein powder": "Φυτική πρωτεΐνη σε σκόνη",
    "Nuts": "Ξηροί καρποί",
    "Avocado": "Αβοκάντο",
    "Tahini": "Ταχίνι",
    "Twelve short questions. Nothing is stored anywhere and nothing is sent to advertising tools.":
      "Δέκα σύντομες ερωτήσεις. Τίποτα δεν αποθηκεύεται πουθενά και τίποτα δεν στέλνεται σε διαφημιστικά εργαλεία.",

    /* long-form copy: exclusion notice, preview, FAQ, terms, privacy, refunds */
    "Vegan": "Βίγκαν",
    "Halal": "Χαλάλ",
    "General wellness guidance — not medical or dietetic care. Educational estimates only.":
      "Γενική καθοδήγηση ευεξίας — όχι ιατρική ή διαιτολογική φροντίδα. Μόνο εκπαιδευτικές εκτιμήσεις.",
    "WEEK 1 · DAY 1": "ΕΒΔΟΜΑΔΑ 1 · ΜΕΡΑ 1",
    "WEEK 1 · DAY 2": "ΕΒΔΟΜΑΔΑ 1 · ΜΕΡΑ 2",
    "SHOPPING LIST": "ΛΙΣΤΑ ΑΓΟΡΩΝ",
    "28-DAY GUIDE": "ΟΔΗΓΟΣ 28 ΗΜΕΡΩΝ",
    "PORTIONS": "ΜΕΡΙΔΕΣ",
    "You ticked something that needs proper professional input, so we are not going to generate an estimate or sell you a guide. That is not a sales tactic — an automatic calorie figure is genuinely the wrong tool here.":
      "Τσέκαρες κάτι που χρειάζεται σωστή επαγγελματική καθοδήγηση, οπότε δεν θα βγάλουμε εκτίμηση ούτε θα σου πουλήσουμε οδηγό. Δεν είναι τέχνασμα πώλησης — ένας αυτόματος αριθμός θερμίδων είναι πραγματικά λάθος εργαλείο εδώ.",
    "Please speak to a registered dietitian or your doctor. They can build something around your actual situation, which is what you need.":
      "Μίλησε με εγγεγραμμένο διαιτολόγο ή με τον γιατρό σου. Μπορούν να φτιάξουν κάτι γύρω από την πραγματική σου κατάσταση, που είναι αυτό που χρειάζεσαι.",
    "The snapshot above, then a longer questionnaire after checkout covering food you like, dislikes, allergies, cooking time and budget.":
      "Την παραπάνω εικόνα, και μετά ένα πιο αναλυτικό ερωτηματολόγιο μετά την αγορά για τροφές που σου αρέσουν, τι δεν τρως, αλλεργίες, χρόνο μαγειρέματος και προϋπολογισμό.",
    "Your calorie and protein ranges set the structure. Your preferences decide what actually goes in the meals.":
      "Τα εύρη θερμίδων και πρωτεΐνης ορίζουν τη δομή. Οι προτιμήσεις σου αποφασίζουν τι μπαίνει πραγματικά στα γεύματα.",
    "Representative layout of the deliverable. Not real nutritional content — your guide is generated from your own answers.":
      "Ενδεικτική διάταξη του παραδοτέου. Όχι πραγματικό διατροφικό περιεχόμενο — ο οδηγός σου δημιουργείται από τις δικές σου απαντήσεις.",
    "Personalised Nutrition & Meal-Planning Guide": "Εξατομικευμένος Οδηγός Διατροφής και Σχεδιασμού Γευμάτων",
    "Healthy Recipes eBook": "eBook με Υγιεινές Συνταγές",
    "A separate recipe collection in the same format. Optional — your guide is complete without it.":
      "Μια ξεχωριστή συλλογή συνταγών στην ίδια μορφή. Προαιρετικό — ο οδηγός σου είναι πλήρης και χωρίς αυτό.",
    "In their words": "Με δικά τους λόγια",
    "From people who used it": "Από ανθρώπους που τον χρησιμοποίησαν",
    "No. It is general educational wellness information and meal-planning examples. It is not medical nutrition therapy, and it does not diagnose, treat, cure or prevent anything.":
      "Όχι. Είναι γενική εκπαιδευτική πληροφόρηση ευεξίας και παραδείγματα σχεδιασμού γευμάτων. Δεν είναι ιατρική διατροφική θεραπεία και δεν διαγιγνώσκει, δεν θεραπεύει και δεν προλαμβάνει τίποτα.",
    "EVZO. We are not dietitians, clinical dietitians, doctors or healthcare professionals, and we do not present ourselves as any of those. The calorie and protein figures come from standard published equations, noted in the guide.":
      "Η EVZO. Δεν είμαστε διαιτολόγοι, κλινικοί διαιτολόγοι, γιατροί ή επαγγελματίες υγείας, ούτε παρουσιαζόμαστε ως τέτοιοι. Οι αριθμοί θερμίδων και πρωτεΐνης προκύπτουν από καθιερωμένες δημοσιευμένες εξισώσεις, που αναφέρονται στον οδηγό.",
    "The structure is built from your goal, measurements, activity level and the questionnaire you complete after purchase — food you like, dislikes, allergies, cooking time, budget and schedule. It is not a fixed template with your name on it.":
      "Η δομή χτίζεται από τον στόχο σου, τις μετρήσεις, το επίπεδο δραστηριότητας και το ερωτηματολόγιο που συμπληρώνεις μετά την αγορά — τροφές που σου αρέσουν, τι δεν τρως, αλλεργίες, χρόνο μαγειρέματος, προϋπολογισμό και πρόγραμμα. Δεν είναι ένα έτοιμο πρότυπο με το όνομά σου πάνω.",
    "A PDF, sent to the email address you give at checkout. Yours to keep, no subscription and no app.":
      "Ένα PDF, που στέλνεται στο email που δίνεις στο ταμείο. Δικό σου για πάντα, χωρίς συνδρομή και χωρίς εφαρμογή.",
    "No. If you have a diagnosed condition, are pregnant or breastfeeding, have a history of disordered eating, or follow a medically prescribed diet, this is not the right product and we will not sell it to you automatically. Speak to a registered dietitian or your doctor.":
      "Όχι. Αν έχεις διαγνωσμένη πάθηση, είσαι έγκυος ή θηλάζεις, έχεις ιστορικό διατροφικής διαταραχής ή ακολουθείς ιατρικά συνταγογραφημένη δίαιτα, αυτό δεν είναι το σωστό προϊόν και δεν θα σου το πουλήσουμε αυτόματα. Μίλησε με εγγεγραμμένο διαιτολόγο ή με τον γιατρό σου.",
    "Yes. The questionnaire asks what you dislike and what you cannot eat, and the guide includes swaps for meals you would rather not cook.":
      "Ναι. Το ερωτηματολόγιο ρωτά τι δεν σου αρέσει και τι δεν μπορείς να φας, και ο οδηγός περιλαμβάνει εναλλακτικές για γεύματα που δεν θέλεις να μαγειρέψεις.",
    "No. One payment, one guide. There is nothing to cancel.":
      "Όχι. Μία πληρωμή, ένας οδηγός. Δεν υπάρχει τίποτα να ακυρώσεις.",
    "Because this is a digital product, you are asked at checkout to consent to receiving it immediately and to acknowledge that doing so ends your 14-day right of withdrawal. Once you have given that consent and the guide has been sent, the sale is final and no refund is due. If the guide is never delivered, is delivered faulty, or is not what was described, contact us and we will put it right or refund you in full — that right cannot be waived.":
      "Επειδή πρόκειται για ψηφιακό προϊόν, στο ταμείο σού ζητείται να συναινέσεις στην άμεση παράδοση και να αναγνωρίσεις ότι έτσι παύει το δικαίωμα υπαναχώρησης 14 ημερών. Μόλις δώσεις αυτή τη συναίνεση και σταλεί ο οδηγός, η πώληση είναι οριστική και δεν οφείλεται επιστροφή χρημάτων. Αν ο οδηγός δεν παραδοθεί ποτέ, παραδοθεί ελαττωματικός ή δεν είναι αυτό που περιγράφηκε, επικοινώνησε μαζί μας και θα το διορθώσουμε ή θα σου επιστρέψουμε όλο το ποσό — αυτό το δικαίωμα δεν παραιτείται.",
    "Your answers are used to build your guide and nothing else. Health-related answers are never sent to advertising or analytics platforms — not to Meta Pixel, not to Google Analytics, not anywhere. See the privacy policy for the full detail.":
      "Οι απαντήσεις σου χρησιμοποιούνται για να φτιαχτεί ο οδηγός σου και για τίποτα άλλο. Απαντήσεις σχετικές με την υγεία δεν στέλνονται ποτέ σε διαφημιστικές πλατφόρμες ή σε εργαλεία ανάλυσης — ούτε στο Meta Pixel, ούτε στο Google Analytics, πουθενά. Δες την πολιτική απορρήτου για όλες τις λεπτομέρειες.",
    "EVZO provides general educational wellness information and personalised meal-planning examples. We are not dietitians, clinical dietitians, doctors or healthcare professionals. Our products do not constitute medical advice, diagnosis, treatment or medical nutrition therapy. They are not suitable for minors, pregnancy, eating disorders, medical conditions or medically prescribed diets. Consult a qualified healthcare professional before changing your diet if you have health concerns.":
      "Η EVZO παρέχει γενική εκπαιδευτική πληροφόρηση ευεξίας και εξατομικευμένα παραδείγματα σχεδιασμού γευμάτων. Δεν είμαστε διαιτολόγοι, κλινικοί διαιτολόγοι, γιατροί ή επαγγελματίες υγείας. Τα προϊόντα μας δεν αποτελούν ιατρική συμβουλή, διάγνωση, θεραπεία ή ιατρική διατροφική θεραπεία. Δεν είναι κατάλληλα για ανηλίκους, εγκυμοσύνη, διατροφικές διαταραχές, ιατρικές παθήσεις ή ιατρικά συνταγογραφημένες δίαιτες. Συμβουλέψου ειδικό επαγγελματία υγείας πριν αλλάξεις τη διατροφή σου αν έχεις θέματα υγείας.",
    "What you are buying.": "Τι αγοράζεις.",
    "A one-time digital guide: a 28-day meal structure with calorie and protein ranges, portions, swaps and a shopping list, generated from the answers you give us. It is delivered as a PDF by email. It is not a subscription and there is nothing to cancel.":
      "Έναν ψηφιακό οδηγό μίας αγοράς: δομή γευμάτων 28 ημερών με εύρη θερμίδων και πρωτεΐνης, μερίδες, εναλλακτικές και λίστα αγορών, φτιαγμένη από τις απαντήσεις που μας δίνεις. Παραδίδεται ως PDF με email. Δεν είναι συνδρομή και δεν υπάρχει τίποτα να ακυρώσεις.",
    "What it is not.": "Τι δεν είναι.",
    "EVZO is not a dietitian, clinical dietitian, doctor or healthcare provider. The guide is general educational wellness information. It does not diagnose, treat, cure or prevent anything, and it is not medical nutrition therapy. If you have a health condition, speak to a qualified professional before changing how you eat.":
      "Η EVZO δεν είναι διαιτολόγος, κλινικός διαιτολόγος, γιατρός ή πάροχος υγείας. Ο οδηγός είναι γενική εκπαιδευτική πληροφόρηση ευεξίας. Δεν διαγιγνώσκει, δεν θεραπεύει και δεν προλαμβάνει τίποτα, και δεν είναι ιατρική διατροφική θεραπεία. Αν έχεις πρόβλημα υγείας, μίλησε με ειδικό πριν αλλάξεις τον τρόπο που τρως.",
    "Who may buy.": "Ποιος μπορεί να αγοράσει.",
    "Adults aged 18 and over who are not pregnant or breastfeeding, do not have a current or previous eating disorder, do not have diabetes or another diagnosed metabolic, kidney, liver or serious gastrointestinal condition, do not have severe food allergies, are not on a medically prescribed diet, and are not taking medication that affects appetite, blood sugar or weight. If any of these apply we will not sell you a guide.":
      "Ενήλικες 18 ετών και άνω που δεν είναι έγκυες ή θηλάζουσες, δεν έχουν τρέχουσα ή παλαιότερη διατροφική διαταραχή, δεν έχουν διαβήτη ή άλλη διαγνωσμένη μεταβολική, νεφρική, ηπατική ή σοβαρή γαστρεντερική πάθηση, δεν έχουν σοβαρές τροφικές αλλεργίες, δεν ακολουθούν ιατρικά συνταγογραφημένη δίαιτα και δεν παίρνουν φαρμακευτική αγωγή που επηρεάζει την όρεξη, το σάκχαρο ή το βάρος. Αν ισχύει κάποιο από αυτά, δεν θα σου πουλήσουμε οδηγό.",
    "Your answers.": "Οι απαντήσεις σου.",
    "The guide is only as good as what you tell us. If you give inaccurate measurements or leave out an allergy or a condition, the guide may not suit you and we cannot be responsible for that.":
      "Ο οδηγός είναι τόσο καλός όσο αυτά που μας λες. Αν δώσεις ανακριβείς μετρήσεις ή παραλείψεις μια αλλεργία ή μια πάθηση, ο οδηγός μπορεί να μην σου ταιριάζει και δεν μπορούμε να φέρουμε ευθύνη γι' αυτό.",
    "Your copy.": "Το αντίτυπό σου.",
    "The guide is licensed to you for personal use. Please do not resell it, republish it or share it publicly.":
      "Ο οδηγός παραχωρείται σε εσένα για προσωπική χρήση. Μην τον μεταπωλείς, μην τον αναδημοσιεύεις και μην τον μοιράζεσαι δημόσια.",
    "Liability.": "Ευθύνη.",
    "Nothing here removes rights you have under EU consumer law, and nothing here limits liability for death or personal injury caused by negligence.":
      "Τίποτα εδώ δεν αφαιρεί δικαιώματα που έχεις βάσει του ευρωπαϊκού δικαίου προστασίας καταναλωτή, και τίποτα εδώ δεν περιορίζει την ευθύνη για θάνατο ή σωματική βλάβη από αμέλεια.",
    "Governing law.": "Εφαρμοστέο δίκαιο.",
    "These terms are governed by the consumer-protection law of the EU member state in which EVZO METHOD is established. Wherever you live in the EU, you also keep the mandatory consumer rights of your own country — nothing here can take those away.":
      "Οι όροι αυτοί διέπονται από το δίκαιο προστασίας καταναλωτή του κράτους μέλους της ΕΕ στο οποίο είναι εγκατεστημένη η EVZO METHOD. Όπου κι αν ζεις στην ΕΕ, διατηρείς επίσης τα υποχρεωτικά δικαιώματα καταναλωτή της χώρας σου — τίποτα εδώ δεν μπορεί να σου τα αφαιρέσει.",
    "What happens on this page.": "Τι συμβαίνει σε αυτή τη σελίδα.",
    "The assessment runs entirely in your browser. Your age, height, weight, activity level and safety answers are held in memory only. They are not written to storage, not sent to a server, and they are gone the moment you close the tab.":
      "Το ερωτηματολόγιο τρέχει εξ ολοκλήρου στον browser σου. Η ηλικία, το ύψος, το βάρος, το επίπεδο δραστηριότητας και οι απαντήσεις ασφαλείας κρατούνται μόνο στη μνήμη. Δεν γράφονται πουθενά, δεν στέλνονται σε διακομιστή και χάνονται τη στιγμή που κλείνεις την καρτέλα.",
    "What we never do.": "Τι δεν κάνουμε ποτέ.",
    "Health-related answers are never sent to advertising or analytics platforms. Not to Meta Pixel, not to Google Analytics, not anywhere. The code that emits analytics events has a fixed list of five permitted fields and drops everything else before it leaves the page — weight, age, allergies, conditions and email cannot pass through it.":
      "Απαντήσεις σχετικές με την υγεία δεν στέλνονται ποτέ σε διαφημιστικές πλατφόρμες ή σε εργαλεία ανάλυσης. Ούτε στο Meta Pixel, ούτε στο Google Analytics, πουθενά. Ο κώδικας που στέλνει συμβάντα ανάλυσης έχει σταθερή λίστα πέντε επιτρεπόμενων πεδίων και απορρίπτει όλα τα υπόλοιπα πριν φύγουν από τη σελίδα — βάρος, ηλικία, αλλεργίες, παθήσεις και email δεν μπορούν να περάσουν.",
    "If you buy.": "Αν αγοράσεις.",
    "We collect the email address you give at checkout, and the answers to the post-purchase questionnaire, solely to build and send your guide. Payment is handled by the payment provider — we never see or store your card details.":
      "Συλλέγουμε το email που δίνεις στο ταμείο και τις απαντήσεις του ερωτηματολογίου μετά την αγορά, αποκλειστικά για να φτιάξουμε και να στείλουμε τον οδηγό σου. Η πληρωμή γίνεται από τον πάροχο πληρωμών — δεν βλέπουμε ούτε αποθηκεύουμε ποτέ τα στοιχεία της κάρτας σου.",
    "How long we keep it.": "Πόσο καιρό τα κρατάμε.",
    "Only as long as we need it to deliver your guide and meet our accounting obligations.":
      "Μόνο όσο χρειάζεται για να παραδώσουμε τον οδηγό σου και να καλύψουμε τις λογιστικές μας υποχρεώσεις.",
    "Your rights.": "Τα δικαιώματά σου.",
    "You can ask for a copy of what we hold, ask us to correct it, or ask us to delete it. Email":
      "Μπορείς να ζητήσεις αντίγραφο όσων τηρούμε, να ζητήσεις διόρθωση ή να ζητήσεις διαγραφή. Στείλε email στο",
    "and we will act on it.": "και θα το φροντίσουμε.",
    "Right now, this page sets no cookies at all": "Αυτή τη στιγμή, η σελίδα δεν βάζει κανένα cookie",
    "and stores nothing in your browser. There is no tracking pixel and no analytics vendor connected.":
      "και δεν αποθηκεύει τίποτα στον browser σου. Δεν υπάρχει pixel παρακολούθησης ούτε συνδεδεμένο εργαλείο ανάλυσης.",
    "If that changes — if an analytics or advertising tool is added — this page will ask for your consent first and this section will be updated to name each cookie, what it is for and how long it lasts. Non-essential cookies will not be set before you agree.":
      "Αν αυτό αλλάξει — αν προστεθεί εργαλείο ανάλυσης ή διαφήμισης — η σελίδα θα ζητήσει πρώτα τη συγκατάθεσή σου και αυτή η ενότητα θα ενημερωθεί ώστε να ονομάζει κάθε cookie, σε τι χρησιμεύει και πόσο διαρκεί. Μη απαραίτητα cookies δεν θα μπαίνουν πριν συμφωνήσεις.",
    "Refund and Digital Delivery Policy": "Πολιτική Επιστροφών και Ψηφιακής Παράδοσης",
    "How delivery works.": "Πώς γίνεται η παράδοση.",
    "Your guide is prepared from your questionnaire answers and sent to you by email as a PDF.":
      "Ο οδηγός σου ετοιμάζεται από τις απαντήσεις του ερωτηματολογίου και σου στέλνεται με email ως PDF.",
    "Your withdrawal right, and how it is waived.": "Το δικαίωμα υπαναχώρησης και πώς παραιτείσαι από αυτό.",
    "Under the EU Consumer Rights Directive you normally have 14 days to withdraw from a purchase. For digital content there is one exception: if you ask for delivery to begin immediately and acknowledge that this ends the withdrawal right, it ends. That is exactly what the two boxes at checkout are for, and neither is ticked for you.":
      "Βάσει της ευρωπαϊκής Οδηγίας για τα Δικαιώματα των Καταναλωτών έχεις κανονικά 14 ημέρες για να υπαναχωρήσεις από μια αγορά. Για ψηφιακό περιεχόμενο υπάρχει μία εξαίρεση: αν ζητήσεις να ξεκινήσει άμεσα η παράδοση και αναγνωρίσεις ότι έτσι παύει το δικαίωμα υπαναχώρησης, αυτό παύει. Ακριβώς γι' αυτό υπάρχουν τα δύο κουτάκια στο ταμείο, και κανένα δεν είναι τσεκαρισμένο εκ των προτέρων.",
    "once you have given that consent and the guide has been sent, the sale is final and no refund is due.":
      "μόλις δώσεις αυτή τη συναίνεση και σταλεί ο οδηγός, η πώληση είναι οριστική και δεν οφείλεται επιστροφή.",
    "What is never waived.": "Τι δεν παραιτείται ποτέ.",
    "If the guide is not delivered, is faulty, or is not what was described, you are entitled to have it put right or refunded in full. No policy can take that away. Email":
      "Αν ο οδηγός δεν παραδοθεί, είναι ελαττωματικός ή δεν είναι αυτό που περιγράφηκε, δικαιούσαι διόρθωση ή πλήρη επιστροφή χρημάτων. Καμία πολιτική δεν μπορεί να το αφαιρέσει αυτό. Στείλε email στο",
    "and we will deal with it.": "και θα το τακτοποιήσουμε.",
    "If you change your mind before delivery,": "Αν αλλάξεις γνώμη πριν την παράδοση,",
    "tell us before the guide is sent and we will refund you.":
      "πες μας πριν σταλεί ο οδηγός και θα σου επιστρέψουμε τα χρήματα.",
    "Contact:": "Επικοινωνία:",

    /* practical FAQ — the questions a buyer actually has */
    "How long do the meals take to cook?": "Πόση ώρα θέλουν τα γεύματα;",
    "You tell us before the plan is built — fifteen minutes, half an hour, an hour — and nothing that takes longer goes in it. Most of what we build lands between fifteen and thirty minutes, because a plan you have no time to cook is not a plan.":
      "Μας το λες πριν φτιαχτεί το πλάνο — δεκαπέντε λεπτά, μισή ώρα, μία ώρα — και τίποτα πιο αργό δεν μπαίνει μέσα. Τα περισσότερα είναι μεταξύ δεκαπέντε και τριάντα λεπτών, γιατί ένα πλάνο που δεν προλαβαίνεις να μαγειρέψεις δεν είναι πλάνο.",
    "Do I need special ingredients or supplements?": "Χρειάζομαι ειδικά υλικά ή συμπληρώματα;",
    "No. Everything comes from an ordinary supermarket in Cyprus or Greece — chicken, yoghurt, lentils, rice, olive oil, whatever is in season. No powders, no imported health foods, nothing you have to order.":
      "Όχι. Όλα βρίσκονται σε ένα κανονικό σούπερ μάρκετ σε Κύπρο ή Ελλάδα — κοτόπουλο, γιαούρτι, φακές, ρύζι, ελαιόλαδο, ό,τι έχει η εποχή. Χωρίς σκόνες, χωρίς εισαγόμενα, χωρίς παραγγελίες.",
    "I have never followed a plan before. Is it too much?":
      "Δεν έχω ακολουθήσει ποτέ πλάνο. Είναι δύσκολο;",
    "It is built for exactly that. You weigh three things — oil, anything dry, anything from a jar — and eyeball the rest. Vegetables never get weighed. Most people stop needing the scale after a fortnight.":
      "Ακριβώς γι' αυτό είναι φτιαγμένο. Ζυγίζεις τρία πράγματα — λάδι, ό,τι είναι ξηρό, ό,τι βγαίνει από βάζο — και τα υπόλοιπα με το μάτι. Τα λαχανικά δεν ζυγίζονται ποτέ. Οι περισσότεροι δεν χρειάζονται ζυγαριά μετά από δεκαπέντε μέρες.",
    "What if I do not like what is in it?": "Κι αν δεν μου αρέσει αυτό που έχει μέσα;",
    "You tell us what you will not eat before it is built, and those foods never appear. Every meal also comes with an alternative, so a night you cannot face the plan does not end the week.":
      "Μας λες τι δεν τρως πριν φτιαχτεί, και αυτά δεν εμφανίζονται ποτέ. Κάθε γεύμα έχει και εναλλακτική, ώστε ένα βράδυ που δεν αντέχεις το πλάνο να μην τελειώνει την εβδομάδα.",

    /* fulfilment */
    "within 24 hours": "εντός 24 ωρών",

    /* macro split */
    "How do you like your food to be made up?": "Πώς σου αρέσει να συνθέτεις το φαγητό σου;",
    "Same calories either way — this only changes how they are arranged between protein, carbohydrate and fat. Pick the way of eating you can actually keep up; that matters more than the ratio itself.":
      "Οι ίδιες θερμίδες έτσι κι αλλιώς — αλλάζει μόνο το πώς μοιράζονται σε πρωτεΐνη, υδατάνθρακες και λιπαρά. Διάλεξε τον τρόπο που μπορείς πραγματικά να κρατήσεις· αυτό μετράει περισσότερο από την ίδια την αναλογία.",
    "Balanced": "Ισορροπημένο",
    "An even spread of carbohydrate and fat. The default if you are not sure.":
      "Ισόποση κατανομή υδατανθράκων και λιπαρών. Η προεπιλογή αν δεν είσαι σίγουρος.",
    "Higher protein": "Περισσότερη πρωτεΐνη",
    "Protein at the top of your range, so meals stay filling.":
      "Πρωτεΐνη στο ανώτερο όριο του εύρους σου, ώστε τα γεύματα να χορταίνουν.",
    "Lower carb": "Λιγότεροι υδατάνθρακες",
    "More fat, fewer carbohydrates. Bread and pasta stay smaller.":
      "Περισσότερα λιπαρά, λιγότεροι υδατάνθρακες. Το ψωμί και τα ζυμαρικά μένουν λιγότερα.",
    "Higher carb": "Περισσότεροι υδατάνθρακες",
    "More carbohydrate, less fat. Suits training days and endurance work.":
      "Περισσότεροι υδατάνθρακες, λιγότερα λιπαρά. Ταιριάζει σε ημέρες προπόνησης και αντοχής.",
    "Whichever you pick, carbohydrate never goes below 50 g a day and fat never goes below what your body needs. A preference shapes the plan; it cannot push it somewhere unsafe.":
      "Ό,τι κι αν διαλέξεις, οι υδατάνθρακες δεν πέφτουν ποτέ κάτω από 50 g την ημέρα και τα λιπαρά ποτέ κάτω από όσα χρειάζεται το σώμα σου. Η προτίμηση διαμορφώνει το πλάνο· δεν μπορεί να το πάει κάπου μη ασφαλές.",
    "Your chosen split": "Η κατανομή που διάλεξες",
    "Pick how you like your food to be made up.": "Διάλεξε πώς σου αρέσει να συνθέτεις το φαγητό σου.",
    "Nine short questions. Nothing is stored anywhere and nothing is sent to advertising tools.":
      "Εννέα σύντομες ερωτήσεις. Τίποτα δεν αποθηκεύεται πουθενά και τίποτα δεν στέλνεται σε διαφημιστικά εργαλεία.",

    /* dynamic keys used by app.js */
    "split_balanced\": \"ισορροπημένη\", \"split_higher_protein": "περισσότερη πρωτεΐνη",
    "split_lower_carb\": \"λιγότεροι υδατάνθρακες\", \"split_higher_carb": "περισσότεροι υδατάνθρακες",
    "goal_lose\": \"χάσιμο λίπους\", \"goal_maintain\": \"διατήρηση\", \"goal_gain": "αύξηση βάρους",
    "result_lede": "Αυτά είναι εκπαιδευτικές εκτιμήσεις, όχι ιατρικές οδηγίες. Είναι ένα σημείο εκκίνησης που προσαρμόζεις με βάση το τι βλέπεις στην πράξη.",
    "result_note": "Οι αριθμοί δίνονται ως εύρη επειδή καμία εξίσωση δεν ξέρει το σώμα σου ακριβώς. Ξεκίνα στη μέση, κράτα το δύο εβδομάδες και προσάρμοσε. Αν έχεις ιατρικές ή ειδικές διατροφικές ανάγκες, αυτά μπορεί να μην σου ταιριάζουν.",
    "clamped_note": "Ο ρυθμός που ζητήθηκε θα σε έβαζε πολύ χαμηλά, οπότε η εκτίμηση κρατήθηκε σε ασφαλές επίπεδο.",
    "checkout_unavailable": "Η πληρωμή δεν είναι ακόμα ενεργή σε αυτή τη σελίδα. Δες την τεκμηρίωση ενσωμάτωσης.",
    "faq_when_prefix": "Ο οδηγός σου ετοιμάζεται και αποστέλλεται",
    "faq_when_manual": "Η παράδοση γίνεται χειροκίνητα προς το παρόν, όχι αυτόματα.",
    "Question 1 of 8": "Ερώτηση 1 από 8",
    "consent_required": "Σημείωσε και τα δύο κουτάκια για να συνεχίσεις στην πληρωμή.",
    "Contact: ": "Επικοινωνία: ",
    "contact address not set": "η διεύθυνση επικοινωνίας δεν έχει οριστεί",
    "Questions about any of this?": "Ερωτήσεις για οτιδήποτε από αυτά;",
    "How to reach us.": "Πώς να επικοινωνήσεις.",
    "Contact.": "Επικοινωνία.",
    "The small print": "Τα ψιλά γράμματα",
    "Policies": "Πολιτικές",
    "Written plainly on purpose. These are drafts pending review by a qualified EU consumer-law adviser and will be replaced by the reviewed versions.":
      "Γραμμένες απλά επίτηδες. Είναι προσχέδια που εκκρεμούν έλεγχο από ειδικό δικηγόρο καταναλωτικού δικαίου ΕΕ και θα αντικατασταθούν από τις ελεγμένες εκδοχές.",
    "I accept the Terms and have read the Privacy Policy": "Αποδέχομαι τους Όρους και έχω διαβάσει την Πολιτική Απορρήτου",
    "Send my guide as soon as it is ready": "Στείλτε μου τον οδηγό μόλις είναι έτοιμος",
    "I ask for delivery to begin immediately and I accept that once it is delivered I lose my 14-day right to withdraw. If it is never delivered, faulty, or not as described, my right to a remedy stays.":
      "Ζητώ να ξεκινήσει άμεσα η παράδοση και αποδέχομαι ότι μόλις παραδοθεί χάνω το δικαίωμα υπαναχώρησης 14 ημερών. Αν δεν παραδοθεί ποτέ, είναι ελαττωματικό ή δεν είναι όπως περιγράφεται, το δικαίωμά μου για αποκατάσταση παραμένει.",
    "Draft wording.": "Προσχέδιο κειμένου.",
    "These policies have not yet been reviewed by a qualified EU consumer-law adviser and must be before trading begins.":
      "Αυτές οι πολιτικές δεν έχουν ελεγχθεί ακόμα από ειδικό δικηγόρο καταναλωτικού δικαίου ΕΕ και πρέπει να ελεγχθούν πριν ξεκινήσουν οι πωλήσεις.",

    "excl_pregnantOrBreastfeeding": "Εγκυμοσύνη ή θηλασμός",
    "excl_eatingDisorder": "Τρέχουσα ή προηγούμενη διατροφική διαταραχή",
    "excl_diabetesOrMetabolic": "Διαβήτης ή διαγνωσμένη μεταβολική πάθηση",
    "excl_organCondition": "Πάθηση νεφρών, ήπατος ή σοβαρή γαστρεντερική",
    "excl_severeAllergy": "Σοβαρή τροφική αλλεργία",
    "excl_prescribedDiet": "Ιατρικά συνταγογραφημένη δίαιτα",
    "excl_medicationAffectingWeight": "Φαρμακευτική αγωγή που επηρεάζει όρεξη, σάκχαρο ή βάρος"
  };

  /* English copy for the keys app.js looks up by name. */
  var EN = {
    "split_balanced\": \"balanced\", \"split_higher_protein": "higher protein",
    "split_lower_carb\": \"lower carb\", \"split_higher_carb": "higher carb",
    "goal_lose\": \"lose fat\", \"goal_maintain\": \"maintain\", \"goal_gain": "gain weight",
    "result_lede": "These are educational estimates, not medical instructions. Treat them as a starting point and adjust by what you actually observe.",
    "result_note": "Figures are shown as ranges because no equation knows your body exactly. Start in the middle, hold it for two weeks, then adjust. If you have medical or special dietary needs, these may not suit you.",
    "clamped_note": "The pace requested would have taken you too low, so the estimate was held at a safe level.",
    "checkout_unavailable": "Payment is not connected on this page yet. See the integration document.",
    "consent_required": "Tick both boxes to continue to checkout.",
    "Contact: ": "Contact: ",
    "contact address not set": "contact address not set",
    "faq_when_prefix": "Your guide is prepared and sent",
    "faq_when_manual": "Delivery is manual at present, not automatic.",
    "excl_pregnantOrBreastfeeding": "Pregnancy or breastfeeding",
    "excl_eatingDisorder": "A current or previous eating disorder",
    "excl_diabetesOrMetabolic": "Diabetes or a diagnosed metabolic condition",
    "excl_organCondition": "A kidney, liver or serious gut condition",
    "excl_severeAllergy": "A severe food allergy",
    "excl_prescribedDiet": "A medically prescribed diet",
    "excl_medicationAffectingWeight": "Medication affecting appetite, blood sugar or weight"
  };

  var cur = "en";

  /* Dictionary keys are written on one line; the page's paragraphs are wrapped
     and indented across several. Collapsing runs of whitespace before the lookup
     is what lets the two meet — without it every multi-line paragraph missed its
     entry and silently stayed in English. */
  function key(s) { return String(s).trim().replace(/\s+/g, " "); }

  window.EVZO_T = function (s) {
    var k = key(s);
    if (cur === "el" && EL[k]) return EL[k];
    if (EN[k]) return EN[k];
    return s;
  };

  /* Walk the page's text nodes once, remember the English, swap what we know. */
  var originals = null;
  function collect() {
    originals = [];
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walk.nextNode())) {
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest("script,style")) continue;
      if (n.nodeValue.trim()) originals.push([n, n.nodeValue]);
    }
    // <option> labels live in value-bearing elements; capture them separately.
    Array.prototype.forEach.call(document.querySelectorAll("option"), function (o) {
      if (!o.dataset.en) o.dataset.en = o.textContent;
    });
  }

  function apply() {
    if (!originals) collect();
    originals.forEach(function (pair) {
      var node = pair[0], en = pair[1];
      // Keep the node's own leading and trailing whitespace: it is what holds
      // the spacing to the markup around it.
      var lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
      node.nodeValue = lead + window.EVZO_T(en) + trail;
    });
    Array.prototype.forEach.call(document.querySelectorAll("option"), function (o) {
      o.textContent = window.EVZO_T(o.dataset.en);
    });
    document.body.classList.toggle("gr", cur === "el");
    document.documentElement.setAttribute("lang", cur === "el" ? "el" : "en");
    if (window.EVZO_APP) window.EVZO_APP.rerender();
  }

  document.addEventListener("DOMContentLoaded", function () {
    collect();
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      b.addEventListener("click", function () {
        var want = b.getAttribute("data-lang");
        if (cur === want) return;
        if (!originals) collect();
        cur = want;
        Array.prototype.forEach.call(b.parentNode.querySelectorAll("button"), function (sib) {
          sib.setAttribute("aria-pressed", String(sib === b));
        });
        apply();
      });
    });
  });
})();
