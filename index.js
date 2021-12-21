const core = require('@actions/core');
const github = require('@actions/github');

async function action(){
    try {
        const nameToGreet = core.getInput('include_branches');
        console.log(`Hello ${nameToGreet}!`);
        //This branch 
        const branch_triggering = github.context.payload.ref; //"refs/head/main"
        const workflow = github.context.workflow; //"dev"
        const runID = github.context.runId;
    
        const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));
        console.log("WF: " +workflow)
        console.log("BranchTrigger: " + branch_triggering)

        const req = {
            repo: github.context.repo,
            owner: github.context.owner,
            workflow_id: workflow, branch: "main"};

        const dbg = JSON.stringify(req, undefined, 2)
        console.log(`request: ${dbg}`);
        const res = await octokit.rest.actions.listWorkflowRuns(req)
        const time = (new Date()).toTimeString();
        core.setOutput("workflow_runs", time);

    } catch (error) {
        core.setFailed(error.message);
    }
}
action();