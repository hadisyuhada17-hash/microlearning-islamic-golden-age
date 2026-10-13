/**
 * TACTICAL STATE-DRIVEN ENGINE (PRODUCTION HARDENED)
 * Features: Interactive Chips, Algebra Balancer, Dynamic Progress Gauge
 */

const CURRENT_SCHEMA_VERSION = 3;
const STORAGE_KEY = "tactical_microlearning_state_v3";

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

// FEATURE 1: INTERACTIVE KEYWORD CHIPS INJECTION
function injectKeywordChip(keyword) {
    const inputElem = document.getElementById("reflection-input");
    if (!inputElem) return;

    // Inject keyword ke posisi kursor atau akhir teks
    const start = inputElem.selectionStart;
    const end = inputElem.selectionEnd;
    const currentText = inputElem.value;

    const newText = currentText.substring(0, start) + keyword + currentText.substring(end);
    inputElem.value = newText;
    AppState.reflection_text = newText;

    // Set kursor setelah kata yang diinjeksi
    inputElem.focus();
    inputElem.setSelectionRange(start + keyword.length, start + keyword.length);

    saveState();
    updateValidationMetrics();
}

// FEATURE 2: ALGEBRA BALANCER PUZZLE LOGIC
function applyAlgebraStep(action) {
    const balanceStatus = document.getElementById("balance-status");
    const leftScale = document.getElementById("left-scale");
    const rightScale = document.getElementById("right-scale");
    const feedback = document.getElementById("balancer-feedback");

    if (action === "subtract") {
        // Jawaban Benar (Al-Muqabala: Kurangi 7 dari kedua sisi)
        leftScale.textContent = "x";
        rightScale.textContent = "8";
        balanceStatus.textContent = "Timbangan Seimbang! (x = 8) ⚖️✨";
        balanceStatus.className = "text-emerald-400 font-bold";
        feedback.textContent = "Sempurna! Anda menerapkan Al-Muqabala (penyederhanaan suku seimbang) untuk menyelesaikan persamaan!";

        AppState.node_2_solved = true;
        saveState();
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

// FEATURE 3: DYNAMIC PROGRESS GAUGE BAR & METRICS
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
    
    // Hitung persentase progress (target 150 karakter & kausalitas)
    let percent = Math.min(100, Math.round((metrics.charCount / 150) * 100));
    if (gaugePercentText) gaugePercentText.textContent = `${percent}%`;

    // Visual Color Interpolation untuk Progress Gauge
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

    // Restore Puzzle State jika sudah pernah diselesaikan
    if (AppState.node_2_solved) {
        applyAlgebraStep("subtract");
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
});
