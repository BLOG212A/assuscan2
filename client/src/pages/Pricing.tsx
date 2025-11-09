import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "/mois",
    description: "Pour découvrir AssurScan",
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "3 scans de contrats par mois",
      "Analyse IA basique",
      "Accès à ClaireAI (limité)",
      "Statistiques de base"
    ],
    cta: "Plan actuel",
    popular: false,
    planId: "free"
  },
  {
    name: "Premium",
    price: "19,99€",
    period: "/mois",
    description: "Pour les particuliers exigeants",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "50 scans de contrats par mois",
      "Analyse IA avancée",
      "Accès illimité à ClaireAI",
      "Statistiques détaillées",
      "Export PDF des analyses",
      "Support prioritaire"
    ],
    cta: "Passer à Premium",
    popular: true,
    planId: "premium"
  },
  {
    name: "Enterprise",
    price: "99,99€",
    period: "/mois",
    description: "Pour les professionnels et entreprises",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Scans illimités",
      "Analyse IA premium",
      "ClaireAI avec contexte étendu",
      "Statistiques avancées",
      "Export multi-formats",
      "API access",
      "Support dédié 24/7",
      "Onboarding personnalisé"
    ],
    cta: "Passer à Enterprise",
    popular: false,
    planId: "enterprise"
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const createCheckoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création de la session de paiement");
      setLoadingPlan(null);
    }
  });

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error("Vous devez être connecté pour upgrader");
      setLocation("/auth");
      return;
    }

    if (planId === "free") {
      toast.info("Vous êtes déjà sur le plan gratuit");
      return;
    }

    setLoadingPlan(planId);
    if (planId === "premium" || planId === "enterprise") {
      createCheckoutMutation.mutate({ plan: planId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              AssurScan
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={() => setLocation("/dashboard/settings")}>
                  Mon compte
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setLocation("/auth")}>
                  Connexion
                </Button>
                <Button onClick={() => setLocation("/auth")}>
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
          Tarifs transparents
        </Badge>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Choisis le plan qui te convient
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
          Analyse tes contrats d'assurance avec l'IA et économise jusqu'à 40% sur tes primes
        </p>
        <p className="text-sm text-gray-500">
          Tous les plans incluent un essai gratuit de 14 jours • Annule à tout moment
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? "border-2 border-emerald-500 shadow-2xl scale-105"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1">
                    ⭐ Plus populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.planId)}
                  disabled={loadingPlan === plan.planId}
                >
                  {loadingPlan === plan.planId ? "Chargement..." : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Puis-je changer de plan à tout moment ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Oui, tu peux upgrader ou downgrader ton plan à tout moment. Les changements sont appliqués
                  immédiatement et le prorata est calculé automatiquement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comment fonctionne l'essai gratuit ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tous les plans payants incluent 14 jours d'essai gratuit. Ta carte ne sera débitée qu'après
                  la fin de la période d'essai. Tu peux annuler à tout moment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Que se passe-t-il si je dépasse ma limite ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Si tu atteins ta limite de scans, tu recevras une notification pour upgrader ton plan.
                  Tes analyses précédentes restent accessibles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Les paiements sont-ils sécurisés ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Oui, tous les paiements sont traités par Stripe, leader mondial du paiement en ligne.
                  Nous ne stockons aucune information bancaire.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à économiser sur tes assurances ?</h2>
          <p className="text-xl mb-8 text-emerald-50">
            Rejoins les milliers d'utilisateurs qui ont déjà optimisé leurs contrats
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6 rounded-full"
            onClick={() => setLocation(user ? "/dashboard" : "/auth")}
          >
            Commencer gratuitement
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">AssurScan</h3>
              <p className="text-sm text-gray-400">
                La première plateforme française d'analyse d'assurance par IA
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Fonctionnalités</li>
                <li>Tarifs</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>À propos</li>
                <li>Contact</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>CGU</li>
                <li>Confidentialité</li>
                <li>Mentions légales</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2025 AssurScan.fr - Propulsé par ClaireAI
          </div>
        </div>
      </footer>
    </div>
  );
}
