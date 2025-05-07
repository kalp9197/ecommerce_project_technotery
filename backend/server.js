import app from "./app.js";
import { appConfig } from "./config/app.config.js";

// Start server and listen on configured port
app.listen(appConfig.port, () => {
  console.log(`Server running on port http://localhost:${appConfig.port}`);
});
