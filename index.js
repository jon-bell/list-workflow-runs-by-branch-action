const core = require('@actions/core');
const github = require('@actions/github');

try {
    const nameToGreet = core.getInput('include_branches');
    console.log(`Hello ${nameToGreet}!`);
    //This branch 
    const branch_triggering = github.context.payload.ref; //"refs/head/main"


    const time = (new Date()).toTimeString();
    core.setOutput("workflow_runs", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const context = JSON.stringify(github.context, undefined, 2)
    console.log(`The context: ${context}`);
} catch (error) {
    core.setFailed(error.message);
}
