require('dotenv').config();
const OpenAI = require('openai')


const {
  hasGoodReadme,
  hasGoodStructure,
  hasMeaningfulCommits,
  hasLiveDemo,
  isActivelyMaintained,
  isRealWorldProject,
} = require('./scoring');

function generatePrompt(username, evaluations) {
  return `
You are a technical recruiter evaluating a GitHub profile.

Based on the following repository analysis, write a short but insightful profile summary for the candidate named ${username}. Be professional but encouraging. Mention strengths and areas of improvement.

Repositories:
${evaluations.map(r => `
📦 ${r.name}
- Stars: ${r.stars}
- Has README: ${r.readme}
- Good Structure: ${r.structure}
- Good Commits: ${r.commits}
- Live Demo: ${r.live}
- Actively Maintained: ${r.maintained}
- Real World Project: ${r.realWorld}
`).join('\n')}
`;
}

async function generateSummary(username, repos) {
  const topRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3);

  const evaluations = [];

  for (const repo of topRepos) {
    const [readme, structure, commits] = await Promise.all([
      hasGoodReadme(username, repo.name),
      hasGoodStructure(username, repo.name),
      hasMeaningfulCommits(username, repo.name),
    ]);

    const live = hasLiveDemo(repo);
    const maintained = isActivelyMaintained(repo);
    const realWorld = isRealWorldProject(repo);

    evaluations.push({
      name: repo.name,
      stars: repo.stargazers_count,
      readme,
      structure,
      commits,
      live,
      maintained,
      realWorld,
    });
  }

  const prompt = generatePrompt(username, evaluations);

  return prompt; // return the prompt text to be pasted into ChatGPT
}

module.exports = { generateSummary };
