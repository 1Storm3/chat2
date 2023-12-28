async function createUser(req, res) {
  const { name, surname } = req.body;
  const newPerson = await pool.query(
    "INSERT INTO person (name, surname) values ($1, $2) RETURNING *",
    [name, surname]
  );
  res.json(newPerson.rows[0]);
}

module.exports = createUser;
