import HeroSection from '@/components/HeroSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import ProductCategoriesSection from '@/components/ProductCategoriesSection';
import WhyChooseUs from '@/components/WhyChooseUs';
import CertificatesSection from '@/components/CertificatesSection';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Index = () => {
  const { t } = useTranslation();
  return (
    <div>
      <HeroSection />

      <div className="bg-white py-10 border-b border-border">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-muted-foreground text-base leading-relaxed">
            {t('home.introText')}
          </p>
          <Link
            to="/about"
            className="mt-6 inline-block px-8 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wide hover:bg-primary/85 transition-colors rounded-sm"
          >
            {t('home.readMore')}
          </Link>
        </div>
      </div>
      <FeaturedProducts />
      <ProductCategoriesSection />
      <CertificatesSection />
      <WhyChooseUs />
    </div>
  );
};

export default Index;
