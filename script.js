/**
 * TACTICAL STATE-DRIVEN ENGINE (PRODUCTION HARDENED)
 * Features: Avatars, Dynamic Speech Bubbles, Source Vault Modal, Chips, Algebra Puzzle
 */

const CURRENT_SCHEMA_VERSION = 4;
const STORAGE_KEY = "tactical_microlearning_state_v4";

// Single Source of Truth
const AppState = {
    schema_version: CURRENT_SCHEMA_VERSION,
    node_1_cleared: false,
    node_2_solved: false,
    selected_argument: null, // "A" | "B" | null
    reflection_text: "",
    reflection_submitted: false
};

const CAUSAL_CONJUNCTIONS = [
    "karena", "sebab", "oleh karena itu", "oleh sebab itu", 
    "maka", "sehingga", "akibatnya", "berdasarkan bukti", 
    "dengan demikian", "mempengaruhi", "implikasinya"
];

// DATA DICTIONARY: PRIMARY SOURCE VAULT
const FIGURE_DATA = {
    haytham: {
        name: "Ibn al-Haytham (Alhazen)",
        epithet: "Pelopor Metode Ilmiah Eksperimental & Optika Moden (965–1040 M)",
        badgeClass: "bg-gold/20 text-gold border border-gold/30",
        work: "Kitab al-Manazir (Buku Optik)",
        quote: "\"Kebenaran dicari demi dirinya sendiri. Dan mereka yang mencari sesuatu demi dirinya sendiri tidak disibukkan oleh hal lain kecuali mencari kebenaran itu sendiri.\""
    },
    khwarizmi: {
        name: "Muhammad ibn Musa al-Khwarizmi",
        epithet: "Penemu Aljabar & Konsep Algoritma (780–850 M)",
        badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        work: "Al-Kitab al-mukhtasar fi hisab al-jabr wa'l-muqabala",
        quote: "\"Saya menyusun buku ringkas tentang kalkulasi dengan restorasi dan keseimbangan untuk memenuhi kebutuhan praktis manusia dalam warisan, perataan tanah, dan perdagangan.\""
    },
    rushd: {
        name: "Ibn Rushd (Averroes)",
        epithet: "Sang Komentator Agung & Pembela Rasionalisme (1126–1198 M)",
        badgeClass: "bg-amber-400/20 text-amber-400 border border-amber-400/30",
        work: "Fasl al-Maqal fi ma bayn al-Shari'ah wa al-Hikmah min al-Ittisal",
        quote: "\"Jika penalaran rasional membimbing pada pengetahuan tentang sesuatu, dan wahyu menyebutkannya, maka tidak mungkin ada pertentangan di antara keduanya.\""
    },
    ghazali: {
        name: "Al-Ghazali (Algazel)",
        epithet: "Hujjat al-Islam & Penjaga Batas Epistemologis (1058–1111 M)",
        badgeClass: "bg-sky-400/20 text-sky-400 border border-sky-400/30",
        work: "Tahafut al-Falasifah (Inkoherensi Para Filsuf)",
        quote: "\"Tujuan kami adalah memperingatkan mereka yang percaya bahwa para filsuf terbebas dari kesalahan teologis semata-mata karena ketepatan logika formal mereka.\""
    }
};

// PERSISTENCE ENGINE
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
    } catch (e) {
        console.error("Gagal menyimpan state:", e);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return;

        const parsed = JSON.parse(savedState);
        if (typeof parsed !== "object" || parsed === null) return;

        Object.keys(AppState).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                AppState[key] = parsed[key];
            }
        });

        AppState.schema_version = CURRENT_SCHEMA_VERSION;
    } catch (e) {
        console.error("State corrupted, fallback ke default:", e);
        localStorage.removeItem(STORAGE_KEY);
    }
}

// XSS SANITIZATION BARRIER
function getSanitizedHTML(rawInput) {
    if (typeof DOMPurify !== "undefined" && typeof DOMPurify.sanitize === "function") {
        return DOMPurify.sanitize(rawInput);
    }
    const div = document.createElement("div");
    div.textContent = rawInput;
    return div.innerHTML;
}

// MODAL CONTROLLER FUNCTIONS
function openFigureModal(figureKey) {
    const data = FIGURE_DATA[figureKey];
    if (!data) return;

    const modal = document.getElementById("figure-modal");
    const badge = document.getElementById("modal-badge");
    const title = document.getElementById("modal-title");
    const epithet = document.getElementById("modal-epithet");
    const work = document.getElementById("modal-work");
    const quote = document.getElementById("modal-quote");

    badge.className = `text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold ${data.badgeClass}`;
    badge.textContent = figureKey;
    title.textContent = data.name;
    epithet.textContent = data.epithet;
    work.textContent = data.work;
    quote.textContent = data.quote;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeFigureModal() {
    const modal = document.getElementById("figure-modal");
    if (modal) {
        modal.classList.add("hidden");
        document.body.style.overflow = "auto";
    }
}

// KEYWORD CHIPS INJECTION
function injectKeywordChip(keyword) {
    const inputElem = document.getElementById("reflection-input");
    if (!inputElem) return;

    const start = inputElem.selectionStart;
    const end = inputElem.selectionEnd;
    const currentText = inputElem.value;

    const newText = currentText.substring(0, start) + keyword + currentText.substring(end);
    inputElem.value = newText;
    AppState.reflection_text = newText;

    inputElem.focus();
    inputElem.setSelectionRange(start + keyword.length, start + keyword.length);

    saveState();
    updateValidationMetrics();
}

// ALGEBRA BALANCER PUZZLE LOGIC
function applyAlgebraStep(action) {
    const balanceStatus = document.getElementById("balance-status");
    const leftScale = document.getElementById("left-scale");
    const rightScale = document.getElementById("right-scale");
    const feedback = document.getElementById("balancer-feedback");

    if (action === "subtract") {
        leftScale.textContent = "x";
        rightScale.textContent = "8";
        balanceStatus.textContent = "Timbangan Seimbang! (x = 8) ⚖️✨";
        balanceStatus.className = "text-emerald-400 font-bold";
        feedback.textContent = "Sempurna! Anda menerapkan Al-Muqabala (penyederhanaan suku seimbang) untuk menyelesaikan persamaan!";

        AppState.node_2_solved = true;
        saveState();
        render();
    } else if (action === "add") {
        leftScale.textContent = "x + 14";
        rightScale.textContent = "22";
        balanceStatus.textContent = "Timbangan Tidak Seimbang! ❌";
        balanceStatus.className = "text-red-400 font-bold";
        feedback.textContent = "Menambahkan 7 membuat persamaan makin rumit. Coba kurangi 7 dari kedua sisi!";
    } else if (action === "multiply") {
        leftScale.textContent = "2x + 14";
        rightScale.textContent = "30";
        balanceStatus.textContent = "Timbangan Tidak Seimbang! ❌";
        balanceStatus.className = "text-red-400 font-bold";
        feedback.textContent = "Mengalikan 2 memperbesar nilai di kedua sisi. Coba kurangi 7!";
    }
}

// HEURISTIC VALIDATION ENGINE
function validateReflectionHeuristics(text) {
    const trimmed = text.trim();
    
    const repetitivePattern = /(.)\1{5,}/;
    if (repetitivePattern.test(trimmed)) {
        return { valid: false, reason: "Terdeteksi pola karakter berulang." };
    }

    const charCount = trimmed.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0) : [];
    const wordCount = words.length;

    const lowerText = trimmed.toLowerCase();
    const hasCausal = CAUSAL_CONJUNCTIONS.some(conj => lowerText.includes(conj));

    const isValid = charCount >= 150 && wordCount >= 30 && hasCausal;

    return {
        valid: isValid,
        charCount,
        wordCount,
        hasCausal,
        reason: isValid ? "Valid" : "Syarat analisis belum terpenuhi."
    };
}

// METRICS & GAUGE UPDATE
function updateValidationMetrics() {
    const reflectionInput = document.getElementById("reflection-input");
    if (!reflectionInput) return;

    const text = reflectionInput.value;
    const metrics = validateReflectionHeuristics(text);

    const charElem = document.getElementById("metric-chars");
    const wordElem = document.getElementById("metric-words");
    const causalSpan = document.getElementById("metric-causal");
    const btnSubmit = document.getElementById("btn-submit-reflection");
    
    const gaugeBar = document.getElementById("progress-gauge-bar");
    const gaugePercentText = document.getElementById("gauge-percent-text");

    if (charElem) charElem.textContent = metrics.charCount;
    if (wordElem) wordElem.textContent = metrics.wordCount;
    
    let percent = Math.min(100, Math.round((metrics.charCount / 150) * 100));
    if (gaugePercentText) gaugePercentText.textContent = `${percent}%`;

    if (gaugeBar) {
        gaugeBar.style.width = `${percent}%`;

        if (metrics.valid) {
            gaugeBar.className = "h-full gauge-glowing-green transition-all duration-300";
        } else if (percent >= 50) {
            gaugeBar.className = "h-full bg-amber-500 transition-all duration-300";
        } else {
            gaugeBar.className = "h-full bg-red-500 transition-all duration-300";
        }
    }

    if (causalSpan) {
        if (metrics.hasCausal) {
            causalSpan.textContent = "Terdeteksi ✓";
            causalSpan.className = "text-emerald-400 font-bold";
        } else {
            causalSpan.textContent = "Belum Ada";
            causalSpan.className = "text-red-400";
        }
    }

    if (btnSubmit) {
        if (metrics.valid) {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove("btn-disabled");
            btnSubmit.classList.add("btn-active-gold");
        } else {
            btnSubmit.disabled = true;
            btnSubmit.classList.add("btn-disabled");
            btnSubmit.classList.remove("btn-active-gold");
        }
    }
}

// REACTIVE RENDER ENGINE
function render() {
    const progressText = document.getElementById("progress-text");
    if (progressText) progressText.textContent = AppState.node_1_cleared ? "2 / 2" : "1 / 2";

    const quizUncompleted = document.getElementById("quiz-uncompleted-state");
    const quizCompleted = document.getElementById("quiz-completed-state");
    const quizContainer = document.getElementById("quiz-container");

    if (AppState.node_1_cleared) {
        if (quizUncompleted) quizUncompleted.classList.add("hidden");
        if (quizCompleted) quizCompleted.classList.remove("hidden");
        if (quizContainer) {
            quizContainer.classList.remove("border-dashed", "border-slate-700");
            quizContainer.classList.add("border-solid", "border-emerald-500", "bg-emerald-950/20");
        }
    }

    const btnNode2 = document.getElementById("btn-node-2");
    const lockIcon = document.getElementById("lock-icon");
    const node2Section = document.getElementById("node-2");
    const node2Badge = document.getElementById("node-2-badge");

    if (AppState.node_1_cleared && btnNode2) {
        btnNode2.classList.remove("btn-disabled");
        btnNode2.classList.add("btn-active-gold");
        if (lockIcon) lockIcon.textContent = "🔓";

        if (node2Section) {
            node2Section.classList.remove("opacity-40", "pointer-events-none");
            node2Section.classList.add("opacity-100");
            node2Section.classList.remove("border-slate-800");
            node2Section.classList.add("border-gold-subtle");
        }

        if (node2Badge) {
            node2Badge.classList.remove("bg-slate-700", "text-slate-400");
            node2Badge.classList.add("bg-gold", "text-navy");
            node2Badge.textContent = "NODE 2";
        }
    }

    // Dynamic Speech Bubble Node 1
    const bubbleHaytham = document.getElementById("speech-bubble-haytham");
    if (bubbleHaytham) {
        if (!AppState.node_1_cleared) {
            bubbleHaytham.textContent = "\"Eksperimen al-bayt al-muzlim menunggumu. Selesaikan kuis untuk membuktikan teori intromisi!\"";
        } else {
            bubbleHaytham.textContent = "\"Luar biasa! Cahaya terbukti masuk ke mata, bukan sebaliknya. Akses Node 2 terbuka!\"";
        }
    }

    // Dynamic Speech Bubble Node 2
    const bubbleKhwarizmi = document.getElementById("speech-bubble-khwarizmi");
    if (bubbleKhwarizmi) {
        if (!AppState.node_2_solved) {
            bubbleKhwarizmi.textContent = "\"Seimbangkan timbangan al-jabr (x + 7 = 15). Kurangi 7 dari kedua sisi untuk mencapai al-muqabala!\"";
        } else {
            bubbleKhwarizmi.textContent = "\"Sempurna! Kamu telah menguasai al-muqabala. Persamaan terestorasi dengan x = 8!\"";
        }
    }

    const cardA = document.getElementById("card-arg-a");
    const cardB = document.getElementById("card-arg-b");
    const reflectionContainer = document.getElementById("reflection-container");

    if (AppState.selected_argument === "A") {
        if (cardA) { cardA.classList.add("selected"); cardA.setAttribute("aria-checked", "true"); }
        if (cardB) { cardB.classList.remove("selected"); cardB.setAttribute("aria-checked", "false"); }
        if (reflectionContainer) reflectionContainer.classList.remove("hidden");
    } else if (AppState.selected_argument === "B") {
        if (cardB) { cardB.classList.add("selected"); cardB.setAttribute("aria-checked", "true"); }
        if (cardA) { cardA.classList.remove("selected"); cardA.setAttribute("aria-checked", "false"); }
        if (reflectionContainer) reflectionContainer.classList.remove("hidden");
    }

    const reflectionInput = document.getElementById("reflection-input");
    const renderedOutput = document.getElementById("rendered-reflection-output");
    const sanitizedDisplay = document.getElementById("sanitized-display");

    if (reflectionInput && AppState.reflection_text && reflectionInput.value !== AppState.reflection_text) {
        reflectionInput.value = AppState.reflection_text;
    }

    if (AppState.reflection_submitted && renderedOutput && sanitizedDisplay) {
        renderedOutput.classList.remove("hidden");
        sanitizedDisplay.innerHTML = getSanitizedHTML(AppState.reflection_text);
    }

    updateValidationMetrics();
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    render();

    const btnCompleteQuiz = document.getElementById("btn-complete-quiz");
    if (btnCompleteQuiz) {
        btnCompleteQuiz.addEventListener("click", () => {
            AppState.node_1_cleared = true;
            saveState();
            render();
        });
    }

    const btnNode2 = document.getElementById("btn-node-2");
    if (btnNode2) {
        btnNode2.addEventListener("click", () => {
            if (!AppState.node_1_cleared) {
                alert("Akses Ditolak: Kuis Node 1 belum tervalidasi!");
                return;
            }
            const node2 = document.getElementById("node-2");
            if (node2) node2.scrollIntoView({ behavior: "smooth" });
        });
    }

    const cardA = document.getElementById("card-arg-a");
    const cardB = document.getElementById("card-arg-b");

    if (cardA) {
        cardA.addEventListener("click", () => {
            AppState.selected_argument = "A";
            saveState();
            render();
        });
    }

    if (cardB) {
        cardB.addEventListener("click", () => {
            AppState.selected_argument = "B";
            saveState();
            render();
        });
    }

    const reflectionInput = document.getElementById("reflection-input");
    if (reflectionInput) {
        reflectionInput.addEventListener("input", (e) => {
            AppState.reflection_text = e.target.value;
            updateValidationMetrics();
        });
    }

    const btnSubmit = document.getElementById("btn-submit-reflection");
    if (btnSubmit) {
        btnSubmit.addEventListener("click", () => {
            const metrics = validateReflectionHeuristics(AppState.reflection_text);
            if (!metrics.valid) return;

            AppState.reflection_submitted = true;
            saveState();
            render();
        });
    }

    // Modal Close Events
    const btnCloseModal = document.getElementById("btn-close-modal");
    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", closeFigureModal);
    }

    const modal = document.getElementById("figure-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeFigureModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeFigureModal();
    });
});
