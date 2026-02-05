import { useUser } from "../contexts/UserContext";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, GlobeIcon, VideoIcon } from "lucide-react";

function WelcomeSection({ onCreateSession }) {
  const { user } = useUser();
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <GlobeIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("dashboard.welcome")}, {user?.name || "there"}!
              </h1>
            </div>
            <p className="text-xl text-base-content/60 ml-16">
              {t("nav.tagline")}
            </p>
          </div>
          <button
            onClick={onCreateSession}
            className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl transition-all duration-200 hover:opacity-90"
          >
            <div className="flex items-center gap-3 text-white font-bold text-lg">
              <VideoIcon className="w-6 h-6" />
              <span>{t("dashboard.createMeeting")}</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSection;
