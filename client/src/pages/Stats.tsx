import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  PiggyBank, 
  TrendingUp, 
  Target,
  Calendar
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Stats() {
  const { data: stats } = trpc.contracts.stats.useQuery();
  const { data: contracts } = trpc.contracts.list.useQuery();

  const kpis = [
    {
      icon: <FileText className="w-8 h-8 text-emerald-600" />,
      label: "Contrats scannés",
      value: stats?.totalContracts || 0,
      color: "bg-emerald-100"
    },
    {
      icon: <PiggyBank className="w-8 h-8 text-green-600" />,
      label: "Économies totales détectées",
      value: `${stats?.totalSavings || 0}€`,
      color: "bg-green-100"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      label: "Score moyen",
      value: `${stats?.avgScore || 0}/100`,
      color: "bg-blue-100"
    },
    {
      icon: <Target className="w-8 h-8 text-orange-600" />,
      label: "Lacunes détectées",
      value: contracts?.reduce((sum, c) => sum + (c.coverageGaps?.length || 0), 0) || 0,
      color: "bg-orange-100"
    }
  ];

  // Prepare data for charts
  const contractsByType = contracts?.reduce((acc: any, contract) => {
    const type = contract.contractType || "inconnu";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(contractsByType || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const savingsData = contracts?.map(contract => ({
    name: contract.fileName?.substring(0, 15) + "..." || "Sans nom",
    savings: contract.potentialSavings || 0,
    score: contract.optimizationScore || 0
  })) || [];

  const monthlyData = [
    { month: "Jan", scans: 2, savings: 180 },
    { month: "Fév", scans: 1, savings: 120 },
    { month: "Mar", scans: 3, savings: 340 },
    { month: "Avr", scans: 2, savings: 240 },
    { month: "Mai", scans: 4, savings: 480 },
    { month: "Juin", scans: contracts?.length || 0, savings: stats?.totalSavings || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${kpi.color} rounded-lg flex items-center justify-center mb-4`}>
                  {kpi.icon}
                </div>
                <div className="text-3xl font-bold mb-1">{kpi.value}</div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Savings by Contract */}
          <Card>
            <CardHeader>
              <CardTitle>Économies par contrat</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="savings" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Contracts by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Évolution mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="scans" fill="#10b981" name="Scans" />
                <Bar yAxisId="right" dataKey="savings" fill="#3b82f6" name="Économies (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts?.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">{contract.fileName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {contract.contractType || "Inconnu"} • {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('fr-FR') : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{contract.potentialSavings || 0}€</p>
                    <p className="text-sm text-muted-foreground">économies</p>
                  </div>
                </div>
              ))}

              {(!contracts || contracts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune activité récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
