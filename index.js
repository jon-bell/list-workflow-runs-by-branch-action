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

        /*
        TODO plan:
            1. Get the workflow ID, by using the workflow runID
            https://docs.github.com/en/rest/reference/actions#get-a-workflow-run

            2. List runs of that workflow, specifying branches

                Always get the LAST run of the current branch, and otherwise respect the param
        */
       const thisWfRun = await octokit.rest.actions.getWorkflowRun({
           ...github.context.repo,
           run_id:runID
       })

       const thisWfID = thisWfRun.data.workflow_id;

        const req = {
            ...github.context.repo,
            workflow_id: thisWfID, branch: "main"};

        const dbg = JSON.stringify(req, undefined, 2)
        console.log(`request: ${dbg}`);

        const res = await octokit.rest.actions.listWorkflowRuns(req)
        const time = (new Date()).toTimeString();
        core.setOutput("workflow_runs", time);

        const dbg2 = JSON.stringify(res, undefined, 2)
        console.log(`response: ${dbg2}`);
 
    } catch (error) {
        core.setFailed(error.message);
    }
}
action();