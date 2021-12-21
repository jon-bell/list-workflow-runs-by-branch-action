const core = require('@actions/core');
const github = require('@actions/github');

try {
    const nameToGreet = core.getInput('include_branches');
    console.log(`Hello ${nameToGreet}!`);
    //This branch 
    const branch_triggering = github.context.payload.ref; //"refs/head/main"
    const workflow = github.context.workflow; //"dev"
    const runID = github.context.runId;

    const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));

    const time = (new Date()).toTimeString();
    core.setOutput("workflow_runs", time);
    const dbg = JSON.stringify(res, undefined, 2)
    console.log(`The thing: ${dbg}`);
} catch (error) {
    core.setFailed(error.message);
}
