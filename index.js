const core = require('@actions/core');
const github = require('@actions/github');

async function getLastNWorkflowRuns(octokit, repo, workflow_id, branch, numRuns) {
    const req = {
        ...repo,
        workflow_id: workflow_id, branch: branch,
        status: "success"
    };
    console.log(JSON.stringify(req, null, 2))
    const res = await octokit.rest.actions.listWorkflowRuns(req);
    runs_this_branch = res.data.workflow_runs;
    runs_this_branch.sort((a, b) => {
        return b.created_at.localeCompare(a.created_at);
    });
    const ret = {
        name: branch, 
        workflow_runs: runs_this_branch.slice(0, numRuns)
    };
    return ret;
}
async function action() {
    try {
        const include_branches = core.getInput('include_branches');
        const number_runs = core.getInput('number_runs');
        console.log(`Include: ${include_branches}!`);
        const runID = github.context.runId;

        const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));
        const repo = {
            ...github.context.repo,
        }

        const thisWfRun = await octokit.rest.actions.getWorkflowRun({
            ...repo,
            run_id: runID
        })

        if (core.getInput("repo")) {
            const manualRepo = core.getInput("repo").split("/");
            repo.owner = manualRepo[0];
            repo.repo = manualRepo[1];
        }

        const branch_triggering = thisWfRun.data.head_branch;
        let thisWfID = thisWfRun.data.workflow_id;
        if (core.getInput("workflow_id")) {
            thisWfID = core.getInput("workflow_id");
        }

        const branchesToCheck = [branch_triggering];
        const results = {};
        if (include_branches) {
            for (let s of include_branches.split(",")) {
                s = s.trim();
                if (!branchesToCheck.includes(s)) {
                    branchesToCheck.push(s);
                }
            }
        }
        const byBranch = await Promise.all(branchesToCheck.map(branch => getLastNWorkflowRuns(octokit, repo, thisWfID, branch, number_runs)));


        core.setOutput("workflow_runs", JSON.stringify({ thisRun: thisWfRun.data, byBranch: byBranch }));

        const dbg2 = JSON.stringify(byBranch, undefined, 2)
        console.log(`debug response: ${dbg2}`);

    } catch (error) {
        core.setFailed(error.message);
    }
}
action();