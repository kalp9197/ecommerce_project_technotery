import app from "./app.js";
import { appConfig } from "./config/app.config.js";

// Start server
const PORT = appConfig.port;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
