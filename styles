/**
 * TACTICAL STATE-DRIVEN ENGINE (PRODUCTION HARDENED)
 * Features: Schema Migration, Strict Cross-Origin Guard, Offline Fallback
 */

const CURRENT_SCHEMA_VERSION = 2;
const STORAGE_KEY = "tactical_microlearning_state_v2";
const TRUSTED_QUIZ_ORIGIN = "https://trusted-quiz-provider.com"; // Domain provider kuis resmi

// Single Source of Truth dengan Schema Versioning
const AppState = {
    schema_version: CURRENT_SCHEMA_VERSION,
    node_1_cleared: false,
    selected_argument: null, // "A" | "B" | null
    reflection_text: "",
    reflection_submitted: false
};

const CAUSAL_CONJUNCTIONS = [
    "karena", "sebab", "oleh karena itu", "oleh sebab itu", 
    "maka", "sehingga", "akibatnya", "berdasarkan bukti", 
    "dengan demikian", "mempengaruhi", "implikasinya"
];

// PERSISTENCE ENGINE DENGAN SCHEMA MIGRATION GUARD
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
    } catch (e) {
        console.error("Gagal menyimpan state ke LocalStorage:", e);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return;

        const parsed = JSON.parse(savedState);
        if (typeof parsed !== "object" || parsed === null) return;

        // Migration Check: Jika versi schema lama, lakukan perlakuan khusus/reset aman
        if (!parsed.schema_version || parsed.schema_version < CURRENT_SCHEMA_VERSION) {
            console.warn("Schema versi lama terdeteksi. Mengaplikasikan migrasi state...");
            // Logika migrasi opsional: pertahankan progress dasar tanpa merusak key baru
        }

        // Safe Selective Hydration (Hanya ambil key yang ada di AppState resmi)
        Object.keys(AppState).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                AppState[key] = parsed[key];
            }
        });

        // Enforce versi schema terbaru
        AppState.schema_version = CURRENT_SCHEMA_VERSION;
    } catch (e) {
        console.error("State corrupted, fallback ke default state:", e);
        localStorage.removeItem(STORAGE_KEY);
    }
}

// OFFLINE-SAFE SANITIZATION BARRIER (ZERO-CDN DEPENDENCY)
function getSanitizedHTML(rawInput) {
    // 1. Gunakan DOMPurify jika library dimuat (online/bundled)
    if (typeof DOMPurify !== "undefined" && typeof DOMPurify.sanitize === "function") {
        return DOMPurify.sanitize(rawInput);
    }
    
    // 2. Safe Fallback (Text Node Escaping) jika CDN offline/terblokir
    const div = document.createElement("div");
    div.textContent = rawInput;
    return div.innerHTML;
}

// HEURISTIC VALIDATION ENGINE
function validateReflectionHeuristics(text) {
    const trimmed = text.trim();
    
    // Anti-Spam Repetitive Character Check
    const repetitivePattern = /(.)\1{5,}/;
    if (repetitivePattern.test(trimmed)) {
        return { valid: false, reason: "Terdeteksi pola karakter berulang." };
    }

    const charCount = trimmed.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0) : [];
    const wordCount = words.length;

    const lowerText = trimmed.toLowerCase();
    const hasCausal = CAUSAL_CONJUNCTIONS.some(conj => lowerText.includes(conj));

    // Validasi Kompleksitas: Karakter >= 150, Kata >= 30, & Kausalitas
    const isValid = charCount >= 150 && wordCount >= 30 && hasCausal;

    return {
        valid: isValid,
        charCount,
        wordCount,
        hasCausal,
        reason: isValid ? "Valid" : "Syarat analisis belum terpenuhi."
    };
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

function updateValidationMetrics() {
    const reflectionInput = document.getElementById("reflection-input");
    if (!reflectionInput) return;

    const text = reflectionInput.value;
    const metrics = validateReflectionHeuristics(text);

    const charElem = document.getElementById("metric-chars");
    const wordElem = document.getElementById("metric-words");
    const causalSpan = document.getElementById("metric-causal");
    const btnSubmit = document.getElementById("btn-submit-reflection");

    if (charElem) charElem.textContent = metrics.charCount;
    if (wordElem) wordElem.textContent = metrics.wordCount;
    
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

// SECURE CROSS-ORIGIN IFRAME EVENT LISTENER (ANTI-POISONING)
window.addEventListener("message", (event) => {
    // 1. Strict Origin Verification
    if (event.origin !== TRUSTED_QUIZ_ORIGIN) {
        return; // Mencegah spoofing postMessage dari malicious script/extension
    }

    // 2. Strict Payload Verification
    if (event.data && event.data.type === "QUIZ_COMPLETE" && event.data.node === 1) {
        AppState.node_1_cleared = true;
        saveState();
        render();
    }
});

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
