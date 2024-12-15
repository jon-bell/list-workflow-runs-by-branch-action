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
        let patchThisWFRun = false;
        const coreWFID = core.getInput("workflow_id");
        if (coreWFID && thisWfID !== coreWFID) {
            thisWfID = coreWFID;
            patchThisWFRun = true;
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

        if (patchThisWFRun) {
            //Remove the run on this branch from byBranch, make it be "thisRun"
            const thisRun = byBranch.find(x => x.name === branch_triggering);
            byBranch.splice(byBranch.indexOf(thisRun), 1);
            core.setOutput("workflow_runs", JSON.stringify({ thisRun: {
                repository: thisWfRun.data.repository,
                name: thisWfRun.data.name,
                head_sha: thisRun.workflow_runs[0].head_sha,
                id: thisWfRun.workflow_runs[0].id,
                run_attempt: thisWfRun.workflow_runs[0].run_attempt,
            }
                , byBranch: byBranch
            }));
        } else {
            core.setOutput("workflow_runs", JSON.stringify({ thisRun: thisWfRun.data, byBranch: byBranch }));
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}
action();