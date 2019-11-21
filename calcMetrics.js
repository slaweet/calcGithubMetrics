const axios = require("axios");
const moment = require("moment");
const importJsx = require('import-jsx');
const table = importJsx('./table');

const getPullRequestsData = (projectName, githubToken, sprint) => axios({
    url: 'https://api.github.com/graphql',
    method: 'post',
    headers: {
      'Authorization': `Bearer ${githubToken}`
    },
    data: {
      query: `
query {
  repository(owner:"LiskHQ", name:"${projectName}") {
      pullRequests(first:30,  orderBy: {field: CREATED_AT, direction: DESC}, states:[MERGED]) {
          edges {
              node {
                 title
                 number
                 additions
                 deletions
                 mergedAt
                 comments(first: 50) {
                  edges {
                      node {
                          bodyText
                      }
                  }
                  
                 }
                  reviews(first: 50) {
                      edges {
                       node {
                          bodyText
                      }   
                      }
                  }
                  reviewThreads(first: 50) {
                      edges {
                       node {
                          comments(first: 50) {
                              edges {
                                  node {
                                      bodyText
                                  }
                              }
                          }
                      }   
                      }
                  }
              }
          }
      }
  }
}
`
    }
  }).then(result => {
    const columns = [
      { key: 'Design', emoji: '🎨' },
      { key: 'Functional', emoji: '🐛' },
      { key: 'Requirement', emoji: '📚'},
      { key: 'Coding', emoji: '💅'},
    ];
    if (!result.data.data.repository) console.error(result.data.errors);
    const pullRequests = result.data.data.repository.pullRequests.edges;
    if (!pullRequests) console.log(result.data.data);
    const data = pullRequests.filter(pr => (
      moment(pr.node.mergedAt).isSameOrBefore(moment(sprint.endDate)) && 
      moment(pr.node.mergedAt).isSameOrAfter(moment(sprint.endDate).subtract(sprint.lengthDays, 'day'))
    )).map(pr => {
      const comments = pr.node.comments.edges;
      const reviews = pr.node.reviews.edges;
      const reviewThreads = pr.node.reviewThreads.edges;
      const reviewComments = reviewThreads.reduce((acc, thread) => [...acc, ...thread.node.comments.edges], []);

      const prCalc = [comments, reviews, reviewComments].reduce((acc, commentsArray) => {
          columns.map(({key, emoji}) => {
            acc[key] += calculateNumberOf(commentsArray, emoji);
          });
          return acc;
      }, columns.reduce((accumulator, { key }) => ({ ...accumulator, [key]: 0}), {}));

      return {
        '#': `#${pr.node.number}`,
        ...prCalc,
        Size: `+${pr.node.additions}/-${pr.node.deletions}`.padEnd(10),
        Title: pr.node.title,
      };
    });
    table.printTable(data);
  }, error => {
    console.error(error);
});

const calculateNumberOf = (commentsArray, emoji) => commentsArray.reduce((acc, comment) => acc + comment.node.bodyText.split(emoji).length - 1, 0);

const projectName = process.argv[2];
const githubToken = process.argv[3];
const sprint = {
  endDate: process.argv[4] || moment(),
  lengthDays: process.argv[5] || 12,
}

if (projectName && githubToken) {
  getPullRequestsData(projectName, githubToken, sprint)
} else {
  console.error(`Error: You must specify two arguments: <project-name> <github-token>
There are also two optional arguments [<sprint-end-date> <sprint-length-days>].
Example usage (including optional arguments, assuimg you have your token in GH_TOKEN environment variable):
$ node calcMetrics.js lisk-hub $GH_TOKEN 2010-11-11 14`);
  process.exit(1);
}

