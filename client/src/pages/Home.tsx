import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { 
  FileSearch, 
  TrendingUp, 
  MessageCircle, 
  Car, 
  Home as HomeIcon, 
  Heart, 
  Briefcase,
  Star,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const features = [
    {
      icon: <FileSearch className="w-8 h-8 text-emerald-600" />,
      title: "Scan Intelligent",
      subtitle: "Upload & Analyse Automatique",
      description: "Dépose ton PDF, notre IA l'analyse en 2 minutes et extrait toutes les infos importantes"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      title: "Score d'Optimisation",
      subtitle: "Score sur 100 + Économies",
      description: "Découvre ton score d'optimisation et combien tu peux économiser par an"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-emerald-600" />,
      title: "Assistant ClaireAI",
      subtitle: "Chatbot Expert 24/7",
      description: "Pose toutes tes questions sur ton contrat à notre IA experte en assurance"
    }
  ];

  const solutions = [
    { icon: <Car className="w-6 h-6" />, label: "Assurance Auto" },
    { icon: <HomeIcon className="w-6 h-6" />, label: "Assurance Habitation" },
    { icon: <Heart className="w-6 h-6" />, label: "Assurance Santé" },
    { icon: <Briefcase className="w-6 h-6" />, label: "Assurance Pro" }
  ];

  const stats = [
    { value: "10 000+", label: "contrats scannés" },
    { value: "240€", label: "d'économies moyennes" },
    { value: "4,9/5", label: "satisfaction client" },
    { value: "2 min", label: "d'analyse" }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      city: "Paris",
      avatar: "ML",
      quote: "J'ai économisé 320€ par an sur mon assurance auto grâce à AssurScan. Incroyable !"
    },
    {
      name: "Thomas D.",
      city: "Lyon",
      avatar: "TD",
      quote: "L'analyse IA est bluffante. J'ai découvert des lacunes que je n'avais jamais vues."
    },
    {
      name: "Sophie M.",
      city: "Marseille",
      avatar: "SM",
      quote: "Simple, rapide et efficace. Je recommande à tous mes proches !"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="container relative z-10 text-center text-white py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm bg-white/20 text-white border-white/30">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Propulsé par l'IA
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Scanne ton assurance,<br />
              <span className="text-teal-100">économise en 2 minutes</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-emerald-50 max-w-3xl mx-auto">
              AssurScan analyse tes contrats d'assurance avec l'IA et te révèle les économies cachées
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6 rounded-full shadow-2xl"
                onClick={() => {
                  if (isAuthenticated) {
                    window.location.href = "/dashboard";
                  } else {
                    window.location.href = "/auth";
                  }
                }}
              >
                Scanner mon premier contrat
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Illustration placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12"
          >
            <div className="glass rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
              <div className="flex items-center justify-center space-x-4">
                <FileSearch className="w-16 h-16 text-white" />
                <TrendingUp className="w-16 h-16 text-white" />
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="glass-dark border-emerald-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-8">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-emerald-600 font-semibold mb-3">{feature.subtitle}</p>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Toutes tes assurances analysées</h2>
            <p className="text-xl text-muted-foreground">Une solution complète pour tous tes contrats</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {solutions.map((solution, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="glass-dark hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      {solution.icon}
                    </div>
                    <p className="font-semibold">{solution.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-emerald-100">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Ils nous font confiance</h2>
            <p className="text-xl text-muted-foreground">Des milliers d'utilisateurs satisfaits</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="glass-dark border-emerald-100 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.city}</div>
                      </div>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Prêt à scanner ton assurance ?</h2>
            <p className="text-xl mb-8 text-emerald-50">Commence gratuitement - Aucune carte requise</p>
            <Button 
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6 rounded-full shadow-2xl"
              onClick={() => {
                if (isAuthenticated) {
                  window.location.href = "/dashboard";
                } else {
                  window.location.href = "/auth";
                }
              }}
            >
              Commencer le scan gratuit
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AssurScan</h3>
              <p className="text-slate-400 text-sm">
                La première plateforme française d'analyse d'assurance par IA
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">CGU</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 AssurScan.fr - Propulsé par ClaireAI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
