const core = require('@actions/core');
const github = require('@actions/github');

async function getLastNWorkflowRuns(octokit, workflow_id, branch, numRuns){
    const res = await octokit.rest.actions.listWorkflowRuns({
        ...github.context.repo,
        workflow_id: workflow_id, branch: branch,
        status: "success"
    });
    runs_this_branch = res.data.workflow_runs;
    runs_this_branch.sort((a, b) => {
        return b.created_at.localeCompare(a.created_at);
    });
    const ret = {};
    ret[branch] = runs_this_branch.slice(0, numRuns);
    return ret;
}
async function action() {
    try {
        const include_branches = core.getInput('include_branches');
        const number_runs = core.getInput('number_runs');
        console.log(`Include: ${include_branches}!`);
        //This branch 
        const workflow = github.context.workflow; //"dev"
        const runID = github.context.runId;

        const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));

        const thisWfRun = await octokit.rest.actions.getWorkflowRun({
            ...github.context.repo,
            run_id: runID
        })

        const branch_triggering = thisWfRun.data.head_branch; 
        const thisWfID = thisWfRun.data.workflow_id;

        const branchesToCheck = [branch_triggering];
        const results = {};
        if(include_branches){
            for(let s of include_branches.split(",")){
                s = s.trim();
                if(!branchesToCheck.includes(s)){
                    branchesToCheck.push(s);
                }
            }
        }
        const byBranch = await Promise.all(branchesToCheck.map(branch => getLastNWorkflowRuns(octokit, thisWfID, branch, number_runs)));

        console.log("WF: " + workflow)
        console.log("BranchTrigger: " + branch_triggering)
       
        const time = (new Date()).toTimeString();
        core.setOutput("workflow_runs", time);

        const dbg2 = JSON.stringify(byBranch, undefined, 2)
        console.log(`response: ${dbg2}`);

    } catch (error) {
        core.setFailed(error.message);
    }
}
action();