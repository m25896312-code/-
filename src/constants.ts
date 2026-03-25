export const DIVS = [
  { id: "sci_bio", name: "علمي علوم", icon: "🔬", color: "#00C9A7", subjects: [
    { id: "arabic", name: "اللغة العربية", icon: "ع", color: "#C62A88" },
    { id: "english", name: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0" },
    { id: "biology", name: "الأحياء (متقدم)", icon: "🧬", color: "#56AB2F" },
    { id: "chemistry", name: "الكيمياء (متقدم)", icon: "⚗", color: "#FF6B6B" },
    { id: "physics", name: "الفيزياء (متقدم)", icon: "⚛", color: "#F7971E" },
    { id: "geology", name: "الجيولوجيا وعلوم البيئة", icon: "🪨", color: "#8B7355" },
    { id: "religion", name: "التربية الدينية", icon: "☪", color: "#B8860B" },
  ]},
  { id: "literary", name: "أدبي", icon: "📚", color: "#C62A88", subjects: [
    { id: "arabic", name: "اللغة العربية", icon: "ع", color: "#C62A88" },
    { id: "english", name: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0" },
    { id: "history", name: "التاريخ", icon: "📜", color: "#B06AB3" },
    { id: "geography", name: "الجغرافيا", icon: "🌍", color: "#11998E" },
    { id: "stats", name: "الإحصاء", icon: "📊", color: "#6C63FF" },
    { id: "psychology", name: "علم النفس", icon: "🧠", color: "#F7971E" },
    { id: "religion", name: "التربية الدينية", icon: "☪", color: "#B8860B" },
  ]},
  { id: "sci_math", name: "علمي رياضة", icon: "📐", color: "#6C63FF", subjects: [
    { id: "arabic", name: "اللغة العربية", icon: "ع", color: "#C62A88" },
    { id: "english", name: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0" },
    { id: "pure_math", name: "الرياضيات البحتة", icon: "∑", color: "#6C63FF" },
    { id: "applied_math", name: "الرياضيات التطبيقية", icon: "📐", color: "#A78BFA" },
    { id: "chemistry", name: "الكيمياء (متقدم)", icon: "⚗", color: "#FF6B6B" },
    { id: "physics", name: "الفيزياء (متقدم)", icon: "⚛", color: "#F7971E" },
    { id: "religion", name: "التربية الدينية", icon: "☪", color: "#B8860B" },
  ]},
  { id: "azhar_sci", name: "أزهر علمي", icon: "🕌", color: "#DAA520", subjects: [
    { id: "quran", name: "القرآن الكريم", icon: "📖", color: "#FFD700" },
    { id: "fiqh", name: "الفقه", icon: "⚖", color: "#B8860B" },
    { id: "tafseer", name: "التفسير", icon: "📗", color: "#56AB2F" },
    { id: "tawheed", name: "التوحيد", icon: "☪", color: "#DAA520" },
    { id: "hadith", name: "الحديث الشريف", icon: "📿", color: "#8B6914" },
    { id: "nahw", name: "النحو والصرف", icon: "ع", color: "#C62A88" },
    { id: "balagha", name: "البلاغة والأدب", icon: "✍", color: "#B06AB3" },
    { id: "english", name: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0" },
    { id: "pure_math", name: "الرياضيات البحتة", icon: "∑", color: "#6C63FF" },
    { id: "app_math", name: "الرياضيات التطبيقية", icon: "📐", color: "#A78BFA" },
    { id: "physics", name: "الفيزياء", icon: "⚛", color: "#F7971E" },
    { id: "chemistry", name: "الكيمياء", icon: "⚗", color: "#FF6B6B" },
    { id: "biology", name: "الأحياء", icon: "🧬", color: "#00C9A7" },
  ]},
  { id: "azhar_adabi", name: "أزهر أدبي", icon: "📖", color: "#B8860B", subjects: [
    { id: "quran", name: "القرآن الكريم", icon: "📖", color: "#FFD700" },
    { id: "fiqh", name: "الفقه", icon: "⚖", color: "#B8860B" },
    { id: "tafseer", name: "التفسير", icon: "📗", color: "#56AB2F" },
    { id: "tawheed", name: "التوحيد", icon: "☪", color: "#DAA520" },
    { id: "hadith", name: "الحديث الشريف", icon: "📿", color: "#8B6914" },
    { id: "nahw", name: "النحو والصرف", icon: "ع", color: "#C62A88" },
    { id: "balagha", name: "البلاغة والأدب", icon: "✍", color: "#B06AB3" },
    { id: "inshaa", name: "الإنشاء", icon: "📝", color: "#6C63FF" },
    { id: "english", name: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0" },
    { id: "history", name: "التاريخ", icon: "📜", color: "#A78BFA" },
    { id: "geography", name: "الجغرافيا", icon: "🌍", color: "#11998E" },
    { id: "mantiq", name: "المنطق والفلسفة", icon: "🤔", color: "#FF6B6B" },
  ]},
];

export const QTYPES = [
  { id: "mcq", name: "اختيار متعدد", icon: "☑", desc: "4 خيارات + الإجابة" },
  { id: "short", name: "أسئلة قصيرة", icon: "🎯", desc: "إجابات موجزة" },
  { id: "essay", name: "مقالية", icon: "✍", desc: "إجابة تفصيلية" },
  { id: "define", name: "تعريفات", icon: "📖", desc: "تعريف المصطلحات" },
];

export const DIFFS = [
  { id: "easy", name: "سهل", icon: "😊", color: "#56AB2F", desc: "حفظ وفهم" },
  { id: "medium", name: "متوسط", icon: "🎯", color: "#F7971E", desc: "مستوى الامتحان" },
  { id: "hard", name: "صعب", icon: "🔥", color: "#EF4444", desc: "تحليل متقدم" },
];

export const FINAL_REVIEWS = [
  { subject: "العربي", icon: "ع", color: "#C62A88", items: [
    { name: "كيان عربي مراجعة نهائية", url: "https://t.me/C322C/9963" },
    { name: "البرهان عربي مراجعة نهائية", url: "https://t.me/C322C/10145" },
    { name: "الإبداع عربي مراجعة نهائية", url: "https://t.me/C322C/10140" },
  ]},
  { subject: "الفرنساوي", icon: "🇫🇷", color: "#1CB5E0", items: [
    { name: "برافو فرنساوي مراجعة نهائية", url: "https://t.me/C322C/10041" },
    { name: "مرسي فرنساوي مراجعة نهائية", url: "https://t.me/C322C/10213" },
  ]},
  { subject: "الفيزياء", icon: "⚛", color: "#F7971E", items: [
    { name: "التفوق فيزياء مراجعة نهائية", url: "https://t.me/C322C/9974" },
    { name: "نيوتن فيزياء مراجعة نهائية", url: "https://t.me/C322C/10027" },
    { name: "الوافي فيزياء مراجعة نهائية", url: "https://t.me/C322C/10030" },
    { name: "الخبير فيزياء مراجعة نهائية", url: "https://t.me/C322C/10206" },
  ]},
  { subject: "الكيمياء", icon: "⚗", color: "#FF6B6B", items: [
    { name: "التفوق كيمياء مراجعة نهائية", url: "https://t.me/C322C/10003" },
    { name: "الوافي كيمياء مراجعة نهائية", url: "https://t.me/C322C/10000" },
    { name: "مندليف كيمياء مراجعة نهائية", url: "https://t.me/C322C/10016" },
    { name: "الإيزو كيمياء مراجعة نهائية", url: "https://t.me/C322C/10035" },
    { name: "كتيب فكرة وتطبيق مراجعة نهائية", url: "https://t.me/C322C/10201" },
  ]},
  { subject: "الأحياء", icon: "🧬", color: "#56AB2F", items: [
    { name: "التفوق أحياء مراجعة نهائية", url: "https://t.me/C322C/9993" },
    { name: "الراقي أحياء مراجعة نهائية", url: "https://t.me/C322C/10136" },
  ]},
  { subject: "الإنجليزي", icon: "A", color: "#6C63FF", items: [
    { name: "الإنجليزي — قريباً ⏳", url: "" },
  ]},
];

export const BOOKS = [
  { subject: "اللغة العربية", icon: "ع", color: "#C62A88", items: [
    { name: "كتاب بيان", url: "https://t.me/C322C/7282?single" },
    { name: "كتاب كيان", url: "https://t.me/C322C/7164?single" },
  ]},
  { subject: "اللغة الإنجليزية", icon: "A", color: "#1CB5E0", items: [
    { name: "كتاب المعاصر", url: "https://t.me/C322C/9443" },
    { name: "كتاب جيم", url: "https://t.me/C322C/9393?single" },
  ]},
  { subject: "الأحياء", icon: "🧬", color: "#56AB2F", items: [
    { name: "كتاب الإمتحان", url: "https://t.me/C322C/7088?single" },
    { name: "كتاب التفوق", url: "https://t.me/C322C/7088?single" },
  ]},
  { subject: "الكيمياء", icon: "⚗", color: "#FF6B6B", items: [
    { name: "كتاب الإمتحان", url: "https://t.me/C322C/7032?single" },
    { name: "كتاب التفوق", url: "https://t.me/C322C/725?single" },
  ]},
  { subject: "الفيزياء", icon: "⚛", color: "#F7971E", items: [
    { name: "كتاب الإمتحان", url: "https://t.me/C322C/7032?single" },
    { name: "كتاب التفوق", url: "https://t.me/C322C/7387?single" },
    { name: "كتاب نيوتين", url: "https://t.me/C322C/8063?single" },
  ]},
];

export const TIPS = [
  "المذاكرة زي الأكل، لو مذاكرتش هتقعد بالصفر 😂",
  "اللي بيقول 'هذاكر بكرة' ده بيقول 'أنا هرسب' بأسلوب راقي 🙃",
  "النوم على الكتاب مش مذاكرة، ده نوم على الورق بس 😅",
  "ساعة مذاكرة كل يوم تفضل على ساعة دعاء قبل الامتحان 🤲😂",
  "أنت مش بتذاكر للمدرس، بتذاكر عشان تعيش حياة أحسن 💪",
  "اللي بيقول 'المنهج كتير' انظر للاللي بيذاكر ومستنيش فيك 😤",
  "تليفونك مش أحسن منك، متخليهوش يسرق وقتك 📵",
  "الامتحان مش عدوك، المذاكرة صاحبتك اللي بتحميك منه 🛡️",
  "كل ما حفظت حاجة، قول في نفسك 'دي فلوس في جيبي' 💰",
  "الفرق بين الطالب المجتهد والكسول؟ ساعة واحدة في اليوم! ⏰",
  "النتيجة الكويسة مش بالحظ، بالكيلو اللي ذاكرته 📚",
  "اللي بيتعب دلوقتي بيرتاح بكرة، والعكس صحيح 😎",
  "الصفر في الامتحان ده مش رقم، ده رسالة من المستقبل ⚠️",
  "حفظ صفحة واحدة كل يوم = كتاب في الشهر 📖✨",
  "مذاكرتك دلوقتي هي حريتك بكرة 🗽",
  "كل ما قلت 'تعبت'، فكّر في الإعادة وهتكمل تلقائي 😂",
  "قفل التليفون، افتح الكتاب، وقول بسم الله 📵📚",
  "المذاكرة مش عقوبة، دي استثمار في نفسك 💎",
  "الامتحان جاي سواء ذاكرت أو لأ، فالأحسن تذاكر 😅",
  "مش محتاج تكون عبقري، محتاج بس تواظب 🔄",
  "الشاطر مش اللي بيحفظ، اللي بيفهم ويراجع 🧩",
  "لو مذاكرتش النهارده، بكرة هتتعب أكتر 📉",
  "الوقت مش رح يرجع، المذاكرة دلوقتي أو الندم بعدين 🕐",
  "مش في حاجة اسمها 'فات أوانها'، ابدأ دلوقتي ⚡",
  "حياتك بعد التوجيهي هتتحدد بما عملته دلوقتي 🔮",
  "ساعة في الصبح بتساوي 3 ساعات في الليل، صحّى بدري! 🌄",
  "المراجعة مش إعادة قراءة، هي اختبار نفسك 📝",
  "أنت أقوى من الكسل، بس الكسل بيكذب عليك 😈",
  "نجاحك هيفرح أهلك، ده وحده سبب كافي 🥰",
  "الدماغ زي العضلة، كل ما استخدمتها كبرت 🧠💪",
  "غلطت في سؤال؟ تمام! ده معناه مش هتغلط فيه في الامتحان 💪",
  "كتاب واحد مكرر 3 مرات أحسن من 3 كتب مرة واحدة 📚",
  "نجاح واحد يمسح ألف تعب 🌟",
  "لو المذاكرة سهلة، الكل كان هينجح. صعبها هو ميزتك 💡",
];

export const BADGES = [
  { id: "beginner", name: "مبتدئ", icon: "🌱", min: 0, color: "#56AB2F" },
  { id: "student", name: "طالب", icon: "📖", min: 50, color: "#1CB5E0" },
  { id: "good", name: "متفوق", icon: "⭐", min: 200, color: "#F7971E" },
  { id: "genius", name: "نابغة", icon: "🏆", min: 500, color: "#FFD700" },
  { id: "legend", name: "أسطورة", icon: "🚀", min: 1000, color: "#C62A88" },
];

export function getBadge(pts: number) {
  let b = BADGES[0];
  for (const x of BADGES) {
    if (pts >= x.min) b = x;
  }
  return b;
}
