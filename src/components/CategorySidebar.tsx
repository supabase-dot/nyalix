import { ChevronRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface Category {
  en: string;
  ar: string;
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string | null;
  search: string;
  isLoading: boolean;
  onCategoryClick: (catEn: string) => void;
  onSearchChange: (val: string) => void;
}

const CategorySidebar = ({
  categories,
  activeCategory,
  search,
  isLoading,
  onCategoryClick,
  onSearchChange,
}: CategorySidebarProps) => {
  const { language } = useLanguage();
  const { t } = useTranslation();

  return (
    <aside className="lg:w-60 shrink-0">
      <div className="sticky top-24 bg-card border border-border rounded-sm overflow-hidden shadow-luxury">
        {/* Header */}
        <div className="bg-primary px-4 py-3">
          <h2 className="font-display font-bold text-primary-foreground uppercase tracking-widest text-sm">
            {t('products.categories')}
          </h2>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Category list */}
        <ul className="py-1 max-h-[70vh] overflow-y-auto divide-y divide-border">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </li>
              ))
            : categories.map(cat => {
                const label = language === 'ar' ? cat.ar : cat.en;
                const isActive = activeCategory === cat.en;
                return (
                  <li key={cat.en}>
                    <button
                      onClick={() => onCategoryClick(cat.en)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-foreground hover:text-accent hover:bg-muted'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                      {label}
                    </button>
                  </li>
                );
              })}
        </ul>
      </div>
    </aside>
  );
};

export default CategorySidebar;
