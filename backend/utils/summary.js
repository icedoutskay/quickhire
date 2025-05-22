require('dotenv').config();

const {
  hasGoodReadme,
  hasGoodStructure,
  hasMeaningfulCommits,
  hasLiveDemo,
  isActivelyMaintained,
  isRealWorldProject,
} = require('./scoring');

async function generateSummary(username, repos) {
  const topRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3);

  const summaries = [];

  for (const repo of topRepos) {
    const [readme, structure, commits] = await Promise.all([
      hasGoodReadme(username, repo.name),
      hasGoodStructure(username, repo.name),
      hasMeaningfulCommits(username, repo.name),
    ]);

    const live = hasLiveDemo(repo);
    const maintained = isActivelyMaintained(repo);
    const realWorld = isRealWorldProject(repo);

    const strengths = [];
    const improvements = [];

    if (readme) strengths.push("Has a detailed README");
    else improvements.push("Add a more detailed README");

    if (structure) strengths.push("Good folder structure");
    else improvements.push("Improve project structure (e.g., add src/, tests/, or docs/)");

    if (commits) strengths.push("Commits are meaningful and consistent");
    else improvements.push("Ensure commits are more descriptive and consistent");

    if (live) strengths.push("Has a live demo or deployment");
    else improvements.push("Consider deploying the project and adding a live link");

    if (maintained) strengths.push("Recently updated and actively maintained");
    else improvements.push("Update the project to show active maintenance");

    if (realWorld) strengths.push("Solves a real-world problem");
    else improvements.push("Clarify the project's real-world use or expand its application");

    const summary = `
Repository: ${repo.name}
Stars: ${repo.stargazers_count}

Strengths:
${strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : "- None listed"}

Areas for Improvement:
${improvements.length > 0 ? improvements.map(i => `- ${i}`).join('\n') : "- None"}

`;

    summaries.push(summary.trim());
  }

  return `Top 3 GitHub Repositories for ${username}:\n\n${summaries.join('\n\n')}`;
}

module.exports = { generateSummary };
