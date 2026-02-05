import { Link, useLocation } from "react-router";
import { LayoutDashboardIcon, GlobeIcon, VideoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-base-100/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
            <GlobeIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none">Meetio</span>
            <span className="text-[10px] font-medium opacity-60 tracking-wider">GLOBAL MEETINGS</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* DASHBOARD PAGE LINK */}
          <Link
            to={"/dashboard"}
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 
              ${isActive("/dashboard")
                ? "bg-primary text-primary-content"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
              }
              
              `}
          >
            <div className="flex items-center gap-x-2.5">
              <LayoutDashboardIcon className="size-4" />
              <span className="font-medium hidden sm:inline">{t("nav.dashboard", "Dashboard")}</span>
            </div>
          </Link>

          {/* LANGUAGE SWITCHER */}
          <div className="ml-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
