const handleLogin = require("./handleLogin");
const authenticateUser = require("./authenticateUser");

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { isAuthenticated, user } = await authenticateUser(
      username,
      password
    );
    if (isAuthenticated) {
      await handleLogin(req, res, user);
    } else {
      res.status(401).json({ message: "false" });
    }
  } catch (error) {
    console.error("Ошибка в обработчике маршрута:", error);
    res.status(500).json({ message: "error server" });
  }
};

module.exports = loginUser;
