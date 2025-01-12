import axios from "axios";

class GitHubService {
  constructor(baseURL = import.meta.env.VITE_GITHUB_API_URL) {
    this.api = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_GITHUB_API_TOKEN}`,
      },
    });
    this.user = import.meta.env.VITE_GITHUB_API_USER;
  }

  /**
   * Obtiene los datos de un usuario de GitHub.
   * @returns {Promise<object>} - Datos del usuario.
   */
  async getUser() {
    try {
      const response = await this.api.get(`/users/${this.user}`);

      return response.data;
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      throw new Error("No se pudo obtener la información del usuario.");
    }
  }

  /**
   * Obtiene todos los repositorios del usuario
   * @returns {Promise<object>} - Datos de los repositorios
   */
  async getUserRepos() {
    try {
      const response = await this.api.get(`/users/${this.user}/repos`);
      return response.data;
    } catch (error) {
      console.error("Error al acceder a los repositorios:", error);
      throw new Error("No se pudo obtener la información de los repositorios.");
    }
  }

  /**
   * Obtiene todos los repositorios del usuario
   * @returns {Promise<object>} - Datos de los repositorios
   */
  async getUserRepoLanguages(repo) {
    try {
      const response = await this.api.get(
        `/repos/${this.user}/${repo}/languages`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener datos de los lenguajes usados:", error);
      throw new Error(
        "No se pudo obtener la información de los lenguajes usados."
      );
    }
  }

  async sumLanguages() {
    const languageSum = {};

    const response = await fetch("./data.json");
    const repos = await response.json();
    repos.forEach((repo) => {
      const languages = repo.languages;
      if (languages) {
        for (const language in languages) {
          if (languageSum[language]) {
            // Use language as the key directly
            languageSum[language] += languages[language]; // Add the value of the language
          } else {
            languageSum[language] = languages[language]; // Initialize the value for the language
          }
        }
      }
    });

    const languageChart = [];
    for (const language in languageSum) {
      languageChart.push({ language: language, value: languageSum[language] });
    }

    const pieChartData = {
      name: "Pie Chart",
      description: "",
      last_updated: "",
      languages: languageChart,
    };
    console.log(pieChartData);
  }

  /**
   * Obtiene, filtra y almacena los repositorios del usuario en un archivo JSON.
   * @param {string} filePath - Ruta del archivo JSON donde se almacenarán los datos.
   */
  async fetchAndStoreRepos() {
    try {
      const repos = await this.getUserRepos();

      // Filtrar datos importantes
      const filteredRepos = await Promise.all(
        repos.map(async (repo) => {
          const languages = await this.getUserRepoLanguages(repo.name);
          return {
            name: repo.name,
            description: repo.description,
            languages: languages,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            visibility: repo.visibility,
            url: repo.html_url,
          };
        })
      );
      // console.log(filteredRepos);
      // De momento frenaremos aqui
      return;

      // almacenar en la DB
      // Eventualmente reemplazaremos el llamado de la api por un llamado a la base de datos
      // Y el llamado a la API se realizará una vez al día para actualizar la base de datos con los nuevos repositorios o cambios en los repositorios existentes

      // console.log(`Datos almacenados en ${filePath}`);
    } catch (error) {
      console.error("Error al procesar y almacenar los repositorios:", error);
      throw error;
    }
  }

  // async parseDataforChart() {}

  // many of these funcions should be later moved to the backend service, possibly laravel.
}

export default new GitHubService();
