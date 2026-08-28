import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

export default function useQuestionNavigation(
    questions = [],
) {
    const panelRef = useRef(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        setActive((i) =>
            questions.length
                ? Math.min(i, questions.length - 1)
                : 0,
        );
    }, [questions.length]);

    const goTo = useCallback(
        (index) => {
            if (
                index < 0 ||
                index >= questions.length
            )
                return;

            setActive(index);

            requestAnimationFrame(() => {
                const panel = panelRef.current;
                const target =
                    panel?.querySelector(
                        `[data-question-index="${index}"]`,
                    );

                if (!panel || !target) return;

                panel.scrollTo({
                    top:
                        panel.scrollTop +
                        target.getBoundingClientRect()
                            .top -
                        panel.getBoundingClientRect()
                            .top -
                        58,
                    behavior: "smooth",
                });
            });
        },
        [questions.length],
    );

    return {
        panelRef,
        active,
        setActive,
        goTo,
    };
}
