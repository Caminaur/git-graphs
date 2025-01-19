import { useEffect } from "react";
import "./App.css";
import GitHubService from "./services/GitHubService";
import PieChart from "./charts/pieChart/pieChart";

function App() {
  useEffect(() => {
    async function fetchData() {
      try {
        await GitHubService.sumLanguages();
        // await GitHubService.fetchAndStoreRepos();
      } catch (error) {
        console.error("Error al almacenar repositorios:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="main">
      <PieChart />
      {/* grafico 2 */}
      {/* grafico 3 */}
      {/* grafico 4 */}
    </div>
  );
}

export default App;
