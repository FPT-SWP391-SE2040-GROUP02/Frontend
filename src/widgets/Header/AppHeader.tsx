import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Shield, 
  Radio, 
  ChevronDown, 
  Sparkles, 
  Check, 
  Scale,
  FileCheck,
  KeyRound,
  UserCheck
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { ROLES, type Role } from "@/shared/constants/roles";
import { UserAvatarMenu } from "@/entities/user";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setRole, toggleDemoMode } from "@/app/store/uiSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/**
 * @file AppHeader.tsx
 * @description Widget Header trung tâm tích hợp Hybrid Identity Switcher, Demo Mode Toggle và Breadcrumb.
 * Quản lý trạng thái bằng Redux Toolkit (thay vì useState cục bộ) nhằm bảo đảm tính nhất quán toàn cục.
 * Tuân thủ Master UI Kit (Heritage Forest #0B291E & Champagne Gold #B88E4C) và chuẩn WCAG 2.1 AA.
 */
export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Đọc trạng thái từ Redux Store toàn cục
  const activeRole = useAppSelector((state) => state.ui.currentRole);
  const isDemo = useAppSelector((state) => state.ui.demoMode);

  const handleRoleChange = (newRole: Role) => {
    dispatch(setRole(newRole));

    // Tự động điều hướng thông minh theo ngữ cảnh vai trò mới
    switch (newRole) {
      case ROLES.OWNER:
        navigate(ROUTES.DASHBOARD.ASSETS);
        break;
      case ROLES.EXECUTOR:
        navigate(ROUTES.EXECUTOR.CLAIM);
        break;
      case ROLES.NOTARY:
        navigate(ROUTES.NOTARY.WORKSPACE);
        break;
      case ROLES.BENEFICIARY:
        navigate(ROUTES.BENEFICIARY.CLAIM);
        break;
      case ROLES.ADMIN:
        navigate(ROUTES.ADMIN.AUDIT_LOG);
        break;
      default:
        navigate(ROUTES.HOME);
    }
  };

  const handleToggleDemoMode = () => {
    dispatch(toggleDemoMode());
  };

  const getRoleMeta = (role: Role) => {
    switch (role) {
      case ROLES.OWNER:
        return { label: "Chủ Di Sản", icon: Shield, desc: "Quản lý két & tài sản số" };
      case ROLES.EXECUTOR:
        return { label: "Người Thi Hành", icon: FileCheck, desc: "Nộp chứng từ tử tuất (Đ.68/71)" };
      case ROLES.NOTARY:
        return { label: "Công Chứng Viên", icon: Scale, desc: "Thẩm định & giải phóng khóa" };
      case ROLES.BENEFICIARY:
        return { label: "Người Thừa Kế", icon: KeyRound, desc: "eKYC & giải mã di sản (Đ.620)" };
      case ROLES.ADMIN:
        return { label: "Quản Trị Viên", icon: UserCheck, desc: "Sổ cái kiểm toán WORM" };
      default:
        return { label: "Thành Viên", icon: Shield, desc: "Người dùng hệ thống" };
    }
  };

  const currentRoleMeta = getRoleMeta(activeRole);
  const CurrentIcon = currentRoleMeta.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#DCD9D0] px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-[0_2px_12px_rgba(11,41,30,0.03)] transition-colors">
      {/* Cột trái: Logo & Navigation chính */}
      <div className="flex items-center gap-6">
        <Link 
          to={ROUTES.HOME} 
          className="flex items-center gap-2.5 rounded-[14px] p-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none group"
          aria-label="LegacyVault Trang Chủ"
        >
          <div className="w-10 h-10 rounded-[14px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm group-hover:bg-[#133E2F] transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[#0B291E] tracking-tight">
            Legacy<span className="text-[#B88E4C]">Vault</span>
          </span>
        </Link>

        {/* Menu Điều hướng theo phân hệ */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 text-xs">
          <Link
            to={ROUTES.DASHBOARD.ASSETS}
            className={`px-3 py-1.5 rounded-[12px] font-semibold transition-all ${
              location.pathname.includes("/assets")
                ? "bg-[#0B291E] text-white"
                : "text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6]"
            }`}
          >
            Kho Tài Sản
          </Link>
          <Link
            to={ROUTES.WILLS.ROOT}
            className={`px-3 py-1.5 rounded-[12px] font-semibold transition-all ${
              location.pathname.includes("/wills")
                ? "bg-[#0B291E] text-white"
                : "text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6]"
            }`}
          >
            Di Chúc Số
          </Link>
          <Link
            to={ROUTES.EXECUTOR.CLAIM}
            className={`px-3 py-1.5 rounded-[12px] font-semibold transition-all ${
              location.pathname.includes("/executor")
                ? "bg-[#0B291E] text-white"
                : "text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6]"
            }`}
          >
            Thi Hành Di Chúc
          </Link>
          <Link
            to={ROUTES.NOTARY.WORKSPACE}
            className={`px-3 py-1.5 rounded-[12px] font-semibold transition-all ${
              location.pathname.includes("/notary")
                ? "bg-[#0B291E] text-white"
                : "text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6]"
            }`}
          >
            Công Chứng Viên
          </Link>
          <Link
            to={ROUTES.BENEFICIARY.CLAIM}
            className={`px-3 py-1.5 rounded-[12px] font-semibold transition-all ${
              location.pathname.includes("/claim/beneficiary")
                ? "bg-[#0B291E] text-white"
                : "text-[#66786E] hover:text-[#0B291E] hover:bg-[#EFECE6]"
            }`}
          >
            Nhận Di Sản
          </Link>
        </nav>
      </div>

      {/* Cột phải: Role Switcher, Demo Mode, DMS Heartbeat & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* 1. Công tắc Demo Mode (Chu kỳ 120s trình diễn) */}
        <button
          type="button"
          onClick={handleToggleDemoMode}
          className={`min-h-[40px] px-3 py-1.5 rounded-[16px] text-xs font-bold flex items-center gap-1.5 transition-all border ${
            isDemo 
              ? "bg-[#FFFBEB] border-[#F59E0B] text-[#B45309] shadow-xs" 
              : "bg-[#FAF9F5] border-[#DCD9D0] text-[#66786E] hover:border-[#A8A295]"
          }`}
          title="Bật/Tắt chế độ trình diễn hội đồng: Chu kỳ DMS 120s"
          aria-label="Toggle Demo Mode"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isDemo ? "text-[#F59E0B] animate-spin" : "text-[#A8A295]"}`} />
          <span className="hidden md:inline">Demo Mode</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            isDemo ? "bg-[#F59E0B] text-white" : "bg-[#EFECE6] text-[#66786E]"
          }`}>
            {isDemo ? "120s" : "OFF"}
          </span>
        </button>

        {/* 2. Hybrid Identity Context Switcher (Chuyển vai trò làm việc tức thì) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className="min-h-[40px] px-3.5 py-1.5 rounded-[18px] bg-[#EFECE6] hover:bg-[#E5EDE8] border border-[#DCD9D0] text-xs font-bold text-[#0B291E] flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            aria-label="Chuyển đổi vai trò làm việc"
          >
            <CurrentIcon className="w-4 h-4 text-[#B88E4C]" />
            <span className="hidden sm:inline">{currentRoleMeta.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#66786E]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-[#FAF9F5] border border-[#DCD9D0] shadow-lg rounded-2xl p-1.5" align="end">
            <DropdownMenuLabel className="p-2 space-y-0.5">
              <p className="text-xs font-bold text-[#0B291E]">Chuyển Ngữ Cảnh Vai Trò</p>
              <p className="text-[10px] text-[#66786E]">Hệ thống gắn Header X-Active-Role tức thời</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#EFECE6]" />

            {[
              ROLES.OWNER,
              ROLES.BENEFICIARY,
              ROLES.EXECUTOR,
              ROLES.NOTARY,
              ROLES.ADMIN,
            ].map((roleKey) => {
              const meta = getRoleMeta(roleKey);
              const RoleIcon = meta.icon;
              const isSelected = activeRole === roleKey;

              return (
                <DropdownMenuItem
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey)}
                  className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected ? "bg-[#E5EDE8] text-[#0B291E]" : "hover:bg-[#EFECE6] text-[#14241C]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-[#0B291E] text-[#B88E4C]" : "bg-[#EFECE6] text-[#66786E]"
                    }`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{meta.label}</p>
                      <p className="text-[10px] text-[#66786E]">{meta.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#059669]" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Dead Man's Switch Heartbeat Button */}
        <Link
          to={ROUTES.DMS.ROOT}
          className="min-h-[40px] text-xs font-bold text-[#66786E] hover:text-[#0B291E] px-3 py-1.5 rounded-[16px] hover:bg-[#EFECE6] flex items-center gap-2 transition-all border border-transparent hover:border-[#DCD9D0]"
          aria-label="Chuyển đến trang Dead Man's Switch"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
          <Radio className="w-4 h-4 text-[#059669]" />
          <span className="hidden md:inline">DMS</span>
        </Link>

        {/* 4. Avatar & Đăng xuất */}
        <UserAvatarMenu role={activeRole} />
      </div>
    </header>
  );
};
