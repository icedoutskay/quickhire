const axios = require("axios");

const headers = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

async function hasGoodReadme (username, repoName){
    try{
        const res = await axios.get('https://api.github.com/repos/${username}/${repoName}/readme',  { headers });
        const content = Buffer.from(res.data.content, "base64").toString("utf-8");
        const readmeLength = content.length; 

         const keywords = ["installation", "usage", "license", "contributing"];
    const hasKeywords = keywords.some((word) => content.toLowerCase().includes(word));

    return readmeLength > 300 && hasKeywords;
    }catch {
        return false;
    }
}

async function hasGoodFolderStructure(username, repoName) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${username}/${repoName}/contents`,  { headers });
    const names = res.data.map((item) => item.name.toLowerCase());

    const hasCommonFolders = ["src", "public", "tests", "docs"].some((f) => names.includes(f));
    const hasPackageJson = names.includes("package.json");

    return hasCommonFolders || hasPackageJson;
  } catch {
    return false;
  }
}


function hasLiveDemo(repo) {
  return !!repo.homepage || /vercel|netlify|render|live|demo|fly\.io/i.test(repo.description || "");
}


function isActivelyMaintained(repo) {
  const lastPush = new Date(repo.pushed_at);
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
  return lastPush > threshold;
}


async function hasGoodStructure(username, repoName) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${username}/${repoName}/contents`,  { headers });
    const names = res.data.map((item) => item.name.toLowerCase());

    return (
      names.includes("src") ||
      names.includes("public") ||
      names.includes("package.json") ||
      names.includes("docs") ||
      names.includes("tests")
    );
  } catch {
    return false;
  }
}


function isRealWorldProject(repo) {
  const description = (repo.description || "").toLowerCase();
  const keywords = ["starter", "test", "template", "demo", "tutorial"];
  const isBoilerplate = keywords.some((word) => description.includes(word));
  return !isBoilerplate && repo.stargazers_count > 0;
}


async function hasMeaningfulCommits(username, repoName) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${username}/${repoName}/commits`, { headers });
    return res.data.length >= 10; // arbitrary threshold for non-toy projects
  } catch {
    return false;
  }
}

async function getScore(username, repos) {
  const perRepoScores = [];

  const nonForkedRepos = repos.filter((r) => !r.fork);

  const repoWithScores = await Promise.all(
    nonForkedRepos.map(async (repo) => {
      let score = 0;

      const [readme, structure, commits] = await Promise.all([
        hasGoodReadme(username, repo.name),
        hasGoodStructure(username, repo.name),
        hasMeaningfulCommits(username, repo.name),
      ]);

      const live = hasLiveDemo(repo);
      const maintained = isActivelyMaintained(repo);
      const realWorld = isRealWorldProject(repo);

      if (readme) score += 30;
      if (live) score += 10;
      if (maintained) score += 15;
      if (realWorld) score += 20;
      if (structure) score += 10;
      if (commits) score += 15;
      if (score > 100) score = 100;

      return { ...repo, score };
    })
  );

  const topRepos = repoWithScores.sort((a, b) => b.score - a.score).slice(0, 3);

  const topScores = topRepos.map((r) => r.score);
  const averageScore = topScores.length
    ? topScores.reduce((a, b) => a + b, 0) / topScores.length
    : 0;

  return Math.round(averageScore);
}

module.exports = {
  getScore,
  hasGoodReadme,
  hasGoodStructure,
  hasMeaningfulCommits,
  hasLiveDemo,
  isActivelyMaintained,
  isRealWorldProject,
};