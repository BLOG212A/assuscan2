import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  User, 
  Mail, 
  Crown, 
  Shield,
  Bell,
  Trash2,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: authData } = trpc.auth.me.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
      toast.success("Profil mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  });

  const handleSave = async () => {
    await updateProfileMutation.mutateAsync({
      fullName: fullName || undefined,
      avatarUrl: avatarUrl || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Gérez vos informations de profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={authData?.email || profile?.email || ""}
                  disabled
                  className="bg-slate-50"
                />
                <Badge variant="outline" className="shrink-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL de l'avatar</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gérez votre abonnement AssurScan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {profile?.subscriptionPlan === "premium" ? "Plan Premium" : "Plan Gratuit"}
                  </h3>
                  <Badge className={profile?.subscriptionPlan === "premium" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}>
                    {profile?.subscriptionPlan === "premium" ? "Premium" : "Gratuit"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile?.documentsUploaded || 0}/{profile?.documentsLimit || 3} contrats scannés ce mois
                </p>
              </div>
              {profile?.subscriptionPlan !== "premium" && (
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Passer Premium
                </Button>
              )}
            </div>

            {profile?.subscriptionPlan !== "premium" && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-semibold">Avantages Premium</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    Scans illimités
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    Analyses prioritaires
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    Comparateur d'assurances
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    Support prioritaire
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nouvelles recommandations</p>
                <p className="text-sm text-muted-foreground">
                  Recevoir des alertes pour de nouvelles opportunités d'économies
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Renouvellement de contrat</p>
                <p className="text-sm text-muted-foreground">
                  Rappels avant l'échéance de vos contrats
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Newsletter AssurScan</p>
                <p className="text-sm text-muted-foreground">
                  Conseils et actualités sur l'assurance
                </p>
              </div>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Zone de danger
            </CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Supprimer mon compte</p>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement votre compte et toutes vos données
                </p>
              </div>
              <Button variant="destructive">
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
