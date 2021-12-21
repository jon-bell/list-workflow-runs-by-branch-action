const core = require('@actions/core');
const github = require('@actions/github');

async function getLastNWorkflowRuns(octokit, workflow_id, branch, numRuns){
    const res = await octokit.rest.actions.listWorkflowRuns({
        ...github.context.repo,
        workflow_id: workflow_id, branch: branch
    });
    runs_this_branch = res.data.workflow_runs;
    runs_this_branch.sort((a, b) => {
        return b.created_at.localeCompare(a.created_at);
    });
    return runs_this_branch.slice(0, numRuns);
}
async function action() {
    try {
        const include_branches = core.getInput('include_branches');
        const number_runs = core.getInput('number_runs');
        console.log(`Include: ${include_branches}!`);
        //This branch 
        const branch_triggering = github.context.payload.ref; //"refs/head/main"
        const workflow = github.context.workflow; //"dev"
        const runID = github.context.runId;

        const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));
        console.log("WF: " + workflow)
        console.log("BranchTrigger: " + branch_triggering)

        const thisWfRun = await octokit.rest.actions.getWorkflowRun({
            ...github.context.repo,
            run_id: runID
        })

        const thisWfID = thisWfRun.data.workflow_id;

       
        const time = (new Date()).toTimeString();
        core.setOutput("workflow_runs", time);

        const res = await getLastNWorkflowRuns(octokit, thisWfID, "main", number_runs);
        const dbg2 = JSON.stringify(res, undefined, 2)
        console.log(`response: ${dbg2}`);

    } catch (error) {
        core.setFailed(error.message);
    }
}
action();