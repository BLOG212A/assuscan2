import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [contractCode, setContractCode] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!contractCode.trim()) {
      toast.error('Veuillez saisir du code de contrat intelligent')
      return
    }

    setLoading(true)
    try {
      // Simulation d'analyse - à remplacer par l'API réelle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setAnalysis({
        score: 85,
        vulnerabilities: [
          { type: 'Reentrancy', severity: 'Medium', line: 42 },
          { type: 'Integer Overflow', severity: 'Low', line: 78 }
        ],
        suggestions: [
          'Utiliser des modificateurs de sécurité',
          'Implémenter des vérifications de débordement'
        ]
      })
      
      toast.success('Analyse terminée!')
    } catch (error) {
      toast.error('Erreur lors de l\'analyse')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Déconnexion réussie')
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">AS</span>
              </div>
              <span className="ml-2 text-xl font-semibold">AssurScan</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bonjour, {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Analyse de Contrats Intelligents
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code du contrat intelligent
                </label>
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Collez votre code Solidity ici..."
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Analyse en cours...' : 'Analyser le contrat'}
                </button>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Résultats de l'analyse
                </h2>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="font-medium text-gray-900">Score de sécurité</h3>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${analysis.score}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">{analysis.score}/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="font-medium text-gray-900 mb-2">Vulnérabilités détectées</h3>
                      <div className="space-y-2">
                        {analysis.vulnerabilities.map((vuln: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                            <span className="text-sm">{vuln.type}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              vuln.severity === 'High' ? 'bg-red-100 text-red-800' :
                              vuln.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {vuln.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="font-medium text-gray-900 mb-2">Suggestions d'amélioration</h3>
                      <ul className="space-y-1">
                        {analysis.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg text-center">
                    <p className="text-gray-500">
                      Aucune analyse disponible. Collez votre code et cliquez sur "Analyser le contrat".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
