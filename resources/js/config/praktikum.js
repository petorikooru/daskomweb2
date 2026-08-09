export const TASKS = {
    TesAwal: {
        phase: "ta",
        variant: "pg",
        q: (id) => `/api-v1/soal-ta/${id}`,
        submit: "/api-v1/jawaban-ta",
        sticky: true,
        score: true,
    },
    Jurnal: {
        phase: "jurnal",
        variant: "jurnal",
        q: (id) => `/api-v1/soal-jurnal/${id}`,
        submit: "/api-v1/jawaban-jurnal",
        fitb: {
            q: (id) => `/api-v1/soal-fitb/${id}`,
            submit: "/api-v1/jawaban-fitb",
        },
    },
    Mandiri: {
        phase: "mandiri",
        variant: "essay",
        q: (id) => `/api-v1/soal-tm/${id}`,
        submit: "/api-v1/jawaban-tm",
        sticky: true,
    },
    TesKeterampilan: {
        phase: "tk",
        variant: "pg",
        q: (id) => `/api-v1/soal-tk/${id}`,
        submit: "/api-v1/jawaban-tk",
        sticky: true,
        score: true,
    },
};

export const PHASE_VIEW = {
    ta: "TesAwal",
    fitb_jurnal: "Jurnal",
    mandiri: "Mandiri",
    tk: "TesKeterampilan",
};

export const TASK_NAMES = Object.keys(TASKS);
export const DONE_INITIAL = Object.fromEntries(
    TASK_NAMES.map((x) => [x, false]),
);

export const SCORE_INITIAL = {
    isOpen: false,
    phaseType: null,
    correctAnswers: 0,
    totalQuestions: 0,
    percentage: 0,
    hasError: false,
    isRetrying: false,
};

export const FEEDBACK_INITIAL = {
    isPending: false,
    modulId: null,
    asistenId: null,
};
