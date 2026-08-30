import iconPPT from "../../../../assets/practicum/iconPPT.svg";
import iconVideo from "../../../../assets/practicum/iconVideo.svg";
import iconModule from "../../../../assets/practicum/iconModule.svg";

import MarkdownRenderer from "@/Components/MarkdownRenderer";

function Icon({ name, size = 16 }) {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const icons = {
        down: <path d="m6 9 6 6 6-6" />,
        up: <path d="m18 15-6-6-6 6" />,
        lock: (
            <>
                <rect x="5" y="10" width="14" height="10" rx="2"/>
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v2" />
            </>
        ),
        unlock: (
            <>
                <rect x="5" y="10" width="14" height="10" rx="2"/>
                <path d="M8 10V7a4 4 0 0 1 7.5-2" />
                <path d="M12 14v2" />
            </>
        ),
    };

    return <svg {...props}>{icons[name]}</svg>;
}

const normalizeBooleanFlag = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value === 1;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return (
            normalized === "1" ||
            normalized === "true"
        );
    }

    return false;
};

export default function ModuleAccordionItem({
    module,
    index,
    isOpen,
    onToggle,
}) {
    const unlocked = normalizeBooleanFlag(module?.isUnlocked);
    const english = normalizeBooleanFlag(module?.isEnglish);
    const moduleTitle =
        module?.judul ||
        module?.title ||
        `Modul ${index + 1}`;

    return (
        <article
            className={`relative ${
                isOpen
                    ? "bg-depth-interactive/20"
                    : "hover:bg-depth-interactive/40"
            }`}
        >
            {/* Header */}
            <div className={`sticky top-0 z-30 border-b border-depth bg-depth-card`}>
                <div className="flex items-center gap-3 px-4 py-3 md:px-5">
                    {/* Module Information */}
                    <button
                        type="button"
                        onClick={() => onToggle(index)}
                        className="min-w-0 flex-1 text-left"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <div
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-depth-full border px-2.5 py-1 ${
                                    unlocked
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                        : "border-red-500/30 bg-red-500/10 text-red-400"
                                }`}
                            >
                                <Icon
                                    name={unlocked ? "unlock" : "lock"}
                                    size={14}
                                />

                                <span className="text-[11px] font-semibold">
                                    {unlocked ? "Terbuka" : "Terkunci"}
                                </span>
                            </div>

                            <h3 className="truncate text-sm font-semibold text-depth-primary md:text-base">
                                {moduleTitle}
                            </h3>

                            {english && (
                                <span className="hidden shrink-0 rounded-depth-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 sm:inline-flex">
                                    ENGLISH
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Toggle */}
                    <button
                        type="button"
                        onClick={() => onToggle(index)}
                        aria-label={isOpen ? "Tutup modul" : "Buka modul"}
                        className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-depth-md text-depth-secondary transition hover:bg-depth-interactive hover:text-depth-primary"
                    >
                        <Icon name={ isOpen ? "up" : "down" } size={17}/>
                    </button>
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="px-4 pb-6 pt-4 md:px-5">
                    {unlocked ? (
                        <ModuleContent module={module}/>
                    ) : (
                        <LockedModule title={moduleTitle}/>
                    )}
                </div>
            )}
        </article>
    );
}

function ModuleContent({ module }) {
    return (
        <div className="space-y-5">
            <section>
                <SectionLabel>
                    Pencapaian Pembelajaran
                </SectionLabel>

                <div className="rounded-depth-md border border-depth bg-depth-interactive/20 p-4 md:p-5">
                    {module?.deskripsi ? (
                        <MarkdownRenderer
                            content={module.deskripsi}
                        />
                    ) : (
                        <p className="text-sm italic text-depth-secondary">
                            Belum ada poin pembelajaran.
                        </p>
                    )}
                </div>
            </section>

            {/* Learning Resources */}
            <section>
                <SectionLabel>
                    Sumber Pembelajaran
                </SectionLabel>

                <div className="grid gap-2 sm:grid-cols-3">
                    <ResourceLink
                        href={module?.ppt_link}
                        icon={iconPPT}
                        label="PPT"
                        tone="green"
                    />

                    <ResourceLink
                        href={module?.video_link}
                        icon={iconVideo}
                        label="Video"
                        tone="red"
                    />

                    <ResourceLink
                        href={module?.modul_link}
                        icon={iconModule}
                        label="Modul"
                        tone="blue"
                    />
                </div>
            </section>
        </div>
    );
}

function LockedModule({ title }) {
    return (
        <div className="rounded-depth-lg border border-depth bg-depth-card px-5 py-7 text-center shadow-depth-sm">
            <div className="mb-2 flex items-center justify-center gap-2 text-depth-primary">
                <Icon
                    name="lock"
                    size={18}
                />

                <span className="font-semibold">
                    {title}
                </span>
            </div>

            <p className="text-sm text-depth-secondary">
                Modul ini masih terkunci.
                Silakan kembali lagi setelah
                modul dibuka.
            </p>
        </div>
    );
}

function ResourceLink({
    href,
    icon,
    label,
    tone,
}) {
    if (!href) {
        return (
            <span className="rounded-depth-md border border-depth bg-depth-interactive/30 px-3 py-2 text-sm text-depth-secondary">
                {label} belum tersedia
            </span>
        );
    }

    const toneClass = {
        green: "bg-green-500/10 text-green-400",
        red: "bg-red-500/10 text-red-400",
        blue: "bg-blue-500/10 text-blue-400",
    }[tone];

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
        >
            <span className={`flex h-7 w-7 items-center justify-center rounded-depth-full ${toneClass}`}>
                <img src={icon} alt="" className="h-4 w-4"/>
            </span>
            {label}
        </a>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-depth-secondary">
            {children}
        </p>
    );
}
