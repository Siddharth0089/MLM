import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareIcon, GlobeIcon, MicIcon, UserIcon } from "lucide-react";

function CaptionOverlay({ captions = [], userLanguage, isSpeaking = false }) {
    const { t } = useTranslation();
    const containerRef = useRef(null);

    // Group consecutive captions from the same speaker
    const groupedCaptions = useMemo(() => {
        const groups = [];
        let currentGroup = null;

        captions.forEach((caption) => {
            // Find translation for user's language or use original
            let displayText = caption.originalText;

            if (caption.originalLanguage !== userLanguage && caption.translations) {
                const translation = caption.translations.find(
                    (tr) => tr.language === userLanguage
                );
                if (translation) {
                    displayText = translation.text;
                }
            }

            const formattedCaption = {
                ...caption,
                displayText,
                isTranslated: caption.originalLanguage !== userLanguage,
            };

            // Check if this caption is from the same speaker as current group
            if (currentGroup && currentGroup.speakerUserId === caption.speakerUserId) {
                // Add to existing group - update or append based on isFinal
                if (!caption.isFinal) {
                    // Replace the last interim message in this group
                    const lastIdx = currentGroup.messages.length - 1;
                    if (lastIdx >= 0 && !currentGroup.messages[lastIdx].isFinal) {
                        currentGroup.messages[lastIdx] = formattedCaption;
                    } else {
                        currentGroup.messages.push(formattedCaption);
                    }
                } else {
                    // Final caption - add as new message in same group
                    currentGroup.messages.push(formattedCaption);
                }
                currentGroup.hasInterim = currentGroup.messages.some(m => !m.isFinal);
            } else {
                // New speaker - create new group
                currentGroup = {
                    speakerUserId: caption.speakerUserId,
                    speakerName: caption.speakerName || "Participant",
                    messages: [formattedCaption],
                    hasInterim: !caption.isFinal,
                    isTranslated: formattedCaption.isTranslated,
                };
                groups.push(currentGroup);
            }
        });

        // Return only last 4 groups for cleaner display
        return groups.slice(-4);
    }, [captions, userLanguage]);

    // Auto-scroll to bottom when captions change
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [groupedCaptions]);

    if (groupedCaptions.length === 0) {
        // Only show if actively listening/speaking, otherwise stay invisible
        if (!isSpeaking) return null;

        return (
            <div className="bg-base-200/90 backdrop-blur-sm rounded-xl p-4 border border-base-300">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isSpeaking ? 'bg-success animate-pulse' : 'bg-base-300'}`}>
                        <MicIcon className={`w-4 h-4 ${isSpeaking ? 'text-success-content' : 'text-base-content/50'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-base-content/60">{t("caption.listening", "Listening")}...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-base-200/95 backdrop-blur-sm rounded-xl border border-base-300 overflow-hidden pointer-events-auto">
            {/* Header */}
            <div className="px-4 py-2 bg-base-300/50 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquareIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{t("meeting.captions", "Live Captions")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <GlobeIcon className="w-3 h-3 text-base-content/50" />
                    <span className="text-xs text-base-content/50">{userLanguage}</span>
                </div>
            </div>

            {/* Grouped Captions List */}
            <div
                ref={containerRef}
                className="p-3 max-h-48 overflow-y-auto space-y-3"
            >
                {groupedCaptions.map((group, groupIdx) => (
                    <div
                        key={`${group.speakerUserId}-${groupIdx}`}
                        className="bg-base-300/30 rounded-lg p-3"
                    >
                        {/* Speaker Header */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-300/50">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-primary">
                                {group.speakerName}
                            </span>
                            {group.isTranslated && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">
                                    {t("caption.translated", "Translated")}
                                </span>
                            )}
                            {group.hasInterim && (
                                <span className="loading loading-dots loading-xs text-success ml-auto"></span>
                            )}
                        </div>

                        {/* Combined Messages */}
                        <p className={`text-sm text-base-content leading-relaxed ${group.hasInterim ? "opacity-80" : ""}`}>
                            {group.messages.map((msg, msgIdx) => (
                                <span key={msgIdx} className={!msg.isFinal ? "italic text-base-content/70" : ""}>
                                    {msg.displayText}
                                    {msgIdx < group.messages.length - 1 && msg.isFinal ? " " : ""}
                                </span>
                            ))}
                        </p>
                    </div>
                ))}

                {/* Active Speaking Indicator */}
                {isSpeaking && (
                    <div className="flex items-center gap-2 pt-2 text-success">
                        <MicIcon className="w-3 h-3" />
                        <span className="loading loading-dots loading-xs"></span>
                        <span className="text-xs">{t("caption.listening", "Listening")}...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CaptionOverlay;
