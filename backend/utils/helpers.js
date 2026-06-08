import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

export const parseStockQuantity = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.dirname(__dirname);
const projectRootDir = path.dirname(backendDir);

// Function to run Python script
export const updateRecommendations = () => {
  return new Promise((resolve, reject) => {
    let command;

    if (process.env.IS_DOCKER === "true") {
      command = "python scripts/calculate_recommendations.py";
    } else {
      command = `cd "${projectRootDir}" && .venv\\Scripts\\activate.bat && cd backend\\scripts && python calculate_recommendations.py`;
    }

    console.log("Attempting to run Python script with command:", command);
    console.log("Current directory:", __dirname);
    console.log("Parent directory:", path.dirname(__dirname));

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error running Python script:", error);
        console.error("Error details:", error.message);
        console.error("Error code:", error.code);
        reject(error);
        return;
      }
      if (stderr) {
        console.error("Python script stderr:", stderr);
      }
      console.log("Python script output:", stdout);
      resolve();
    });
  });
};
