import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import image1 from '@/assets/image1.jpg';
import image2 from '@/assets/image2.jpg';
import image3 from '@/assets/image3.jpg';
import image4 from '@/assets/image4.jpg';
import image5 from '@/assets/image5.jpg';
import image6 from '@/assets/image6.jpg';
import image7 from '@/assets/image7.jpg';
import image8 from '@/assets/image8.jpg';
import image9 from '@/assets/image9.jpg';

const galleryImages = [image1, image2, image3, image4, image5, image6, image7, image8, image9];

const ImageCard = (props) => {
  const { src, alt } = props;
  return (
    <div className="overflow-hidden rounded-3xl bg-card border border-border shadow-luxury">
      <div className="w-full min-h-[560px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[780px] flex items-center justify-center bg-slate-950/5">
        <img src={src} alt={alt || 'NyaliX image'} loading="lazy" className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  );
};

const About = () => {
  const { t } = useTranslation();
  
  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="bg-gradient-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4"
          >
            {t('about.pageTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl mx-auto text-lg text-primary-foreground/80"
          >
            {t('about.pageSubtitle')}
          </motion.p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 space-y-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20">
              {t('about.trustedBadge')}
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground">{t('about.storyTitle')}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {t('about.storyText')}
            </p>
          </div>
        </section>
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-luxury">
            <h3 className="text-xl font-semibold text-foreground">{t('about.qualityTitle')}</h3>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {t('about.qualityDesc')}
            </p>
          </div>
          <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-luxury">
            <h3 className="text-xl font-semibold text-foreground">{t('about.supportTitle')}</h3>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {t('about.supportDesc')}
            </p>
          </div>
          <div className="rounded-3xl bg-card border border-border p-8 text-center shadow-luxury">
            <h3 className="text-xl font-semibold text-foreground">{t('about.reachTitle')}</h3>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {t('about.reachDesc')}
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            {galleryImages.map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index }}
              >
                <ImageCard src={src} alt={`NyaliX gallery image ${index + 1}`} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
