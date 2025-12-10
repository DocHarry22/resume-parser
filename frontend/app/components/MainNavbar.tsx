"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  FiMenu, 
  FiX, 
  FiChevronDown,
  FiChevronRight,
  FiFileText,
  FiLayout,
  FiCheckCircle,
  FiBookOpen,
  FiEdit3,
  FiBriefcase,
  FiAward,
  FiHelpCircle,
  FiMessageSquare,
  FiUsers,
  FiZap
} from "react-icons/fi";

type NavItem = {
  label: string;
  href?: string;
  children?: NavSection[];
};

type NavSection = {
  title?: string;
  items: NavLink[];
};

type NavLink = {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
};

const navItems: NavItem[] = [
  {
    label: "Builders",
    children: [
      {
        items: [
          { label: "Resume Builder", href: "/tools?view=builder", description: "Create ATS-optimized resumes with AI", icon: <FiEdit3 size={20} /> },
          { label: "Cover Letter Builder", href: "/tools?view=cover-builder", description: "Write compelling cover letters", icon: <FiFileText size={20} /> },
          { label: "CV Builder", href: "/tools?view=cv-builder", description: "Build academic CVs with ease", icon: <FiBriefcase size={20} /> },
        ]
      }
    ]
  },
  {
    label: "Resumes",
    children: [
      {
        title: "Tools",
        items: [
          { label: "AI Resume Builder", href: "/tools?view=builder", description: "Create with AI assistance", icon: <FiZap size={20} />, badge: "Popular" },
          { label: "Resume Templates", href: "/tools?view=templates", description: "Browse professional designs", icon: <FiLayout size={20} /> },
          { label: "ATS Resume Checker", href: "/tools?view=scanner", description: "Scan and optimize", icon: <FiCheckCircle size={20} /> },
          { label: "Resume Writing Guide", href: "/tools?view=guide_resume", description: "Expert tips & advice", icon: <FiBookOpen size={20} /> },
        ]
      },
      {
        title: "By File Type",
        items: [
          { label: "Google Docs", href: "/tools?view=templates&filter=google-docs" },
          { label: "Microsoft Word", href: "/tools?view=templates&filter=word" },
          { label: "PDF Format", href: "/tools?view=templates&filter=pdf" },
          { label: "Plain Text", href: "/tools?view=templates&filter=plain-text" },
        ]
      },
      {
        title: "Resume Formats",
        items: [
          { label: "Chronological", href: "/tools?view=templates&filter=chronological" },
          { label: "Functional", href: "/tools?view=templates&filter=functional" },
          { label: "Combination", href: "/tools?view=templates&filter=combination" },
          { label: "One Page", href: "/tools?view=templates&filter=one-page" },
        ]
      }
    ]
  },
  {
    label: "Cover Letters",
    children: [
      {
        items: [
          { label: "Cover Letter Builder", href: "/tools?view=cover-builder", description: "AI-powered writing assistant", icon: <FiEdit3 size={20} /> },
          { label: "Cover Letter Templates", href: "/tools?view=cover-templates", description: "Professional templates", icon: <FiLayout size={20} /> },
          { label: "Writing Guide", href: "/tools?view=cover-guide", description: "Step-by-step instructions", icon: <FiBookOpen size={20} /> },
        ]
      }
    ]
  },
  {
    label: "CVs",
    children: [
      {
        items: [
          { label: "CV Builder", href: "/tools?view=cv-builder", description: "Build comprehensive CVs", icon: <FiBriefcase size={20} /> },
          { label: "CV Templates", href: "/tools?view=cv-templates", description: "Academic & professional", icon: <FiLayout size={20} /> },
          { label: "CV Writing Guide", href: "/tools?view=cv-guide", description: "Expert guidance", icon: <FiBookOpen size={20} /> },
        ]
      }
    ]
  },
  {
    label: "Resources",
    children: [
      {
        title: "Learn",
        items: [
          { label: "Career Blog", href: "/resources/blog", description: "Tips and insights", icon: <FiBookOpen size={20} /> },
          { label: "Resume Examples", href: "/resources/examples", description: "Industry-specific samples", icon: <FiAward size={20} /> },
          { label: "Career Guides", href: "/resources/guides", description: "In-depth tutorials", icon: <FiFileText size={20} /> },
        ]
      },
      {
        title: "Support",
        items: [
          { label: "Help Center", href: "/help", icon: <FiHelpCircle size={20} /> },
          { label: "Contact Us", href: "/contact", icon: <FiMessageSquare size={20} /> },
          { label: "About Us", href: "/about", icon: <FiUsers size={20} /> },
        ]
      }
    ]
  }
];

export default function MainNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedItems, setMobileExpandedItems] = useState<string[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
      if (activeDropdown) setActiveDropdown(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeDropdown]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleMouseEnter = useCallback((label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  const toggleMobileItem = (label: string) => {
    setMobileExpandedItems(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileExpandedItems([]);
  };

  return (
    <nav 
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled 
          ? "bg-[#061B2D]/95 backdrop-blur-md shadow-lg shadow-black/10" 
          : "bg-[#061B2D]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2BC4A8] to-[#20a090] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-white font-semibold text-lg group-hover:text-[#2BC4A8] transition-colors">
              CareerForge AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeDropdown === item.label
                      ? "text-[#2BC4A8] bg-white/5"
                      : "text-gray-200 hover:text-white hover:bg-white/5"
                  }`}
                  aria-expanded={activeDropdown === item.label}
                  aria-haspopup="true"
                >
                  {item.label}
                  {item.children && (
                    <FiChevronDown 
                      size={14} 
                      className={`transition-transform duration-200 ${
                        activeDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.label && (
                  <DropdownMenu 
                    sections={item.children} 
                    onClose={() => setActiveDropdown(null)}
                    isLarge={item.label === "Resumes"}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#2BC4A8] to-[#20a090] rounded-lg hover:shadow-lg hover:shadow-[#2BC4A8]/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#0a2540] border-t border-white/10 px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMobileItem(item.label)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <span className="font-medium">{item.label}</span>
                    <FiChevronDown 
                      size={16}
                      className={`transition-transform duration-200 ${
                        mobileExpandedItems.includes(item.label) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      mobileExpandedItems.includes(item.label) 
                        ? "max-h-[1000px] opacity-100" 
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-4 py-2 space-y-1">
                      {item.children.map((section, idx) => (
                        <div key={idx} className="py-2">
                          {section.title && (
                            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {section.title}
                            </p>
                          )}
                          {section.items.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={closeMobileMenu}
                              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {link.icon && (
                                <span className="text-[#2BC4A8]">{link.icon}</span>
                              )}
                              <span>{link.label}</span>
                              {link.badge && (
                                <span className="ml-auto text-xs px-2 py-0.5 bg-[#2BC4A8]/20 text-[#2BC4A8] rounded-full">
                                  {link.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href || "/"}
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          {/* Mobile Auth Buttons */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="block w-full px-4 py-3 text-center text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={closeMobileMenu}
              className="block w-full px-4 py-3 text-center text-white bg-gradient-to-r from-[#2BC4A8] to-[#20a090] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#2BC4A8]/25 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================
// DROPDOWN MENU COMPONENT
// ============================================
function DropdownMenu({ 
  sections, 
  onClose,
  isLarge = false
}: { 
  sections: NavSection[]; 
  onClose: () => void;
  isLarge?: boolean;
}) {
  const hasMultipleSections = sections.length > 1;
  const cols = Math.min(sections.length, 3);
  
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
      <div 
        className={`bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden animate-dropdown ${
          isLarge ? "w-[760px]" : hasMultipleSections ? "w-[520px]" : "w-[340px]"
        }`}
      >
        <div 
          className={`p-6 ${hasMultipleSections ? "grid gap-6" : ""}`}
          style={hasMultipleSections ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : {}}
        >
          {sections.map((section, idx) => (
            <div key={idx}>
              {section.title && (
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-150"
                    >
                      {link.icon && (
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#2BC4A8]/10 to-[#20a090]/5 text-[#2BC4A8] flex items-center justify-center group-hover:from-[#2BC4A8] group-hover:to-[#20a090] group-hover:text-white transition-all duration-200">
                          {link.icon}
                        </span>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 group-hover:text-[#2BC4A8] transition-colors text-[15px]">
                            {link.label}
                          </span>
                          {link.badge && (
                            <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-[#2BC4A8] to-[#20a090] text-white rounded-full font-semibold uppercase tracking-wide">
                              {link.badge}
                            </span>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                            {link.description}
                          </p>
                        )}
                      </div>
                      {link.description && (
                        <FiChevronRight 
                          size={16} 
                          className="flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-[#2BC4A8] group-hover:translate-x-1 transition-all duration-200 mt-2.5" 
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Footer for large menus */}
        {isLarge && (
          <div className="bg-gradient-to-r from-[#061B2D] to-[#0a2540] px-6 py-5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2BC4A8]/20 to-[#20a090]/10 flex items-center justify-center">
                  <FiZap size={22} className="text-[#2BC4A8]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-[15px]">Ready to build your resume?</p>
                  <p className="text-gray-400 text-sm">AI-powered builder with 50+ templates</p>
                </div>
              </div>
              <Link
                href="/tools?view=builder"
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#2BC4A8] to-[#20a090] rounded-xl hover:shadow-lg hover:shadow-[#2BC4A8]/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                Start Building
                <FiChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
