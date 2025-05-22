const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { getScore } = require("./utils/scoring");
const { generateSummary } = require('./utils/summary');

const headers = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

const app = express();
app.use(cors());

app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const repos= await axios.get(`https://api.github.com/users/${username}/repos`,  { headers });
    const reposData = repos.data;
    const score = await getScore(username, reposData);
    const summary = await generateSummary(username, reposData);

    res.json({ username, score, summary, repos: reposData.slice(0, 3) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));