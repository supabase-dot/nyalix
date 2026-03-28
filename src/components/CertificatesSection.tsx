import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { type LucideIcon, Shield, Award, FileCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Certificate {
  id: string;
  title: string;
  title_ar: string;
  type: string;
  file_url: string;
}

const typeIcons: Record<string, LucideIcon> = { ISO: Shield, CE: Award, FDA: FileCheck };
const typeColors: Record<string, string> = {
  ISO: 'from-blue-500 to-blue-700',
  CE: 'from-green-500 to-green-700',
  FDA: 'from-amber-500 to-amber-700',
};

const CertificatesSection = () => {
  const { t, i18n } = useTranslation();
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
      setCerts((data as unknown as Certificate[]) ?? []);
    };
    fetch();
  }, []);

  if (certs.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground mb-3">{t('certifications.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('certifications.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.slice(0, 6).map((cert, i) => {
            const Icon = typeIcons[cert.type] || Shield;
            const color = typeColors[cert.type] || 'from-gray-500 to-gray-700';

            return (
              <motion.a key={cert.id} href={cert.file_url} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-luxury group hover:shadow-gold transition-all duration-300 block">
                <div className={`h-2 bg-gradient-to-r ${color}`} />
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-gold mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 bg-gradient-to-r ${color} text-white`}>{cert.type}</span>
                  <h3 className="text-lg font-display font-bold text-foreground mb-1">
                    {i18n.language === 'ar' && cert.title_ar ? cert.title_ar : cert.title}
                  </h3>
                  <span className="text-xs text-accent flex items-center justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" /> View Certificate
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/certifications"
            className="inline-block px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold">
            {t('certifications.title')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CertificatesSection;
