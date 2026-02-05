import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  CheckIcon,
  GlobeIcon,
  LanguagesIcon,
  MailIcon,
  MessageSquareIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Tilt from "react-parallax-tilt";

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-base-300 via-base-100 to-primary/10 min-h-screen">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          {/* LOGO */}
          <Link
            to={"/"}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <GlobeIcon className="size-6 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                MeetLingua
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">{t("nav.tagline")}</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* AUTH BTN */}
            <Link to="/login">
              <button className="group px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2">
                <span>{t("home.getStarted")}</span>
                <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-8">
            <div className="badge badge-primary badge-lg gap-2">
              <LanguagesIcon className="size-4" />
              {t("home.features.translation")}
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("home.title")}
              </span>
              <br />
              <span className="text-base-content text-4xl lg:text-5xl">{t("home.subtitle")}</span>
            </h1>

            <p className="text-xl text-base-content/70 leading-relaxed max-w-xl">
              {t("home.description")}
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap gap-3">
              <div className="badge badge-lg badge-outline gap-2">
                <CheckIcon className="size-4 text-success" />
                {t("home.features.translation")}
              </div>
              <div className="badge badge-lg badge-outline gap-2">
                <CheckIcon className="size-4 text-success" />
                {t("home.features.captions")}
              </div>
              <div className="badge badge-lg badge-outline gap-2">
                <CheckIcon className="size-4 text-success" />
                {t("home.features.email")}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <button className="btn btn-primary btn-lg">
                  {t("home.getStarted")}
                  <ArrowRightIcon className="size-5" />
                </button>
              </Link>

              <button className="btn btn-outline btn-lg">
                <VideoIcon className="size-5" />
                Watch Demo
              </button>
            </div>

            {/* LANGUAGE FLAGS */}
            <div className="flex items-center gap-4 bg-base-100 rounded-2xl p-4 shadow-lg w-fit">
              <span className="text-sm text-base-content/60">Supported Languages:</span>
              <div className="flex gap-2">
                <span className="text-2xl" title="English">🇺🇸</span>
                <span className="text-2xl" title="Hindi">🇮🇳</span>
                <span className="text-2xl" title="French">🇫🇷</span>
                <span className="text-2xl" title="Spanish">🇪🇸</span>
              </div>
            </div>
          </div>

          {/* RIGHT - Visual */}
          <div className="relative">
            <Tilt
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={1000}
              scale={1.02}
              transitionSpeed={1500}
              className="parallax-effect"
            >
              <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl p-8 shadow-2xl border border-base-300">
                {/* Navbar Placeholder inside Hero Visual */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <GlobeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-base-content/80">Meetio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-base-content/60" />
                    <span className="text-sm text-base-content/60">4</span>
                  </div>
                </div>
                {/* Mock Meeting UI */}
                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                      <span className="text-sm font-medium">Live Meeting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-base-content/60" />
                      <span className="text-sm text-base-content/60">4</span>
                    </div>
                  </div>

                  {/* Mock Video Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-video bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                        <span className="text-lg font-bold">JD</span>
                      </div>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
                        <span className="text-lg font-bold">AS</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Caption */}
                  <div className="bg-base-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquareIcon className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-primary">John (English → Hindi):</span>
                        <p className="text-sm mt-1">"नमस्ते, आज की बैठक में आपका स्वागत है!"</p>
                      </div>
                    </div>
                  </div>

                  {/* Mock Notes */}
                  <div className="bg-base-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-medium text-secondary">Meeting Notes (Auto-translated)</span>
                    </div>
                    <p className="text-sm text-base-content/70">
                      • Project deadline: March 15th<br />
                      • Next review: Friday 3PM
                    </p>
                  </div>
                </div>
              </div>
            </Tilt>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-success text-success-content px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
              Real-time Translation ✨
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need for <span className="text-primary font-mono">Global Meetings</span>
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Powerful features designed to break language barriers and make meetings accessible to everyone
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 - Translation */}
          <div className="glass-panel rounded-2xl hover:scale-105 transition-transform duration-300">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner backdrop-blur-md">
                <LanguagesIcon className="size-8 text-primary" />
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.translation")}</h3>
              <p className="text-base-content/70">
                {t("home.features.translationDesc")}
              </p>
            </div>
          </div>

          {/* Feature 2 - Captions */}
          <div className="glass-panel rounded-2xl hover:scale-105 transition-transform duration-300">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner backdrop-blur-md">
                <MessageSquareIcon className="size-8 text-secondary" />
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.captions")}</h3>
              <p className="text-base-content/70">
                {t("home.features.captionsDesc")}
              </p>
            </div>
          </div>

          {/* Feature 3 - Email Notes */}
          <div className="glass-panel rounded-2xl hover:scale-105 transition-transform duration-300">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner backdrop-blur-md">
                <MailIcon className="size-8 text-accent" />
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.email")}</h3>
              <p className="text-base-content/70">
                {t("home.features.emailDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* POWERED BY LINGO.DEV */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 text-center">
          <p className="text-sm text-base-content/60 mb-2">Powered by</p>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Lingo.dev Localization Engine
          </h3>
          <p className="text-base-content/70 mt-2 max-w-xl mx-auto">
            High-quality, real-time translation for seamless multilingual communication
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-base-200 border-t border-base-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GlobeIcon className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">MeetLingua</span>
          </div>
          <p className="text-sm text-base-content/60">
            Built for the Lingo.dev Hackathon • Breaking Language Barriers in Meetings
          </p>
        </div>
      </footer>
    </div>
  );
}
export default HomePage;